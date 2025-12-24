'use client';

import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { cnToTw } from '@/lib/zh-convert';

const processed = new WeakSet<Node>();

function shouldSkipNode(node: Node): boolean {
  const parent = node.parentElement;
  if (!parent) return true;
  const tag = parent.tagName;
  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'LINK') return true;
  if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'CODE' || tag === 'PRE') return true;
  if (parent.closest('[data-no-zhconvert="true"]')) return true;
  return false;
}

function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(text);
}

export default function TraditionalChineseAutoConvert() {
  const { language } = useI18n();

  useEffect(() => {
    if (language !== 'zh-TW') return;

    // Fast cache to skip redundant work
    const nodeValueCache = new WeakMap<Node, string>();

    const convertTextNode = (node: Text) => {
      if (shouldSkipNode(node)) return;

      const value = node.nodeValue;
      if (!value || !containsChinese(value)) return;

      // Skip if we already converted this exact string for this node
      if (nodeValueCache.get(node) === value) return;

      const converted = cnToTw(value);
      if (converted !== value) {
        // Mark as processed BEFORE setting value to prevent observer trigger re-processing
        processed.add(node);
        nodeValueCache.set(node, converted);
        node.nodeValue = converted;
      } else {
        // Even if no change needed, cache it to skip next time
        nodeValueCache.set(node, value);
      }
    };

    const walkAndConvert = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        convertTextNode(root as Text);
        return;
      }

      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let current: Node | null;
      while ((current = walker.nextNode())) {
        convertTextNode(current as Text);
      }
    };

    // Initial pass
    walkAndConvert(document.body);

    let idleHandle: number | null = null;
    let pendingMutations: MutationRecord[] = [];

    const processMutations = () => {
      const mutations = pendingMutations;
      pendingMutations = [];
      idleHandle = null;

      for (const mutation of mutations) {
        if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
          const node = mutation.target as Text;
          if (!processed.has(node)) {
            convertTextNode(node);
          } else {
            processed.delete(node);
          }
        }
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            walkAndConvert(node);
          });
        }
      }
    };

    const observer = new MutationObserver((mutations) => {
      pendingMutations.push(...mutations);

      if (idleHandle === null) {
        if (typeof window.requestIdleCallback === 'function') {
          idleHandle = window.requestIdleCallback(processMutations, { timeout: 150 }) as any;
        } else {
          idleHandle = setTimeout(processMutations, 100) as any;
        }
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      if (idleHandle !== null) {
        if (typeof window.requestIdleCallback === 'function') {
          window.cancelIdleCallback(idleHandle);
        } else {
          clearTimeout(idleHandle);
        }
      }
    };
  }, [language]);

  return null;
}
