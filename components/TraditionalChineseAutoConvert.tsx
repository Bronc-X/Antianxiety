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

    const convertTextNode = (node: Text) => {
      if (shouldSkipNode(node)) return;
      const value = node.nodeValue;
      if (!value || !containsChinese(value)) return;

      const converted = cnToTw(value);
      if (converted !== value) {
        // Mark as processed BEFORE setting value to prevent observer trigger re-processing the same change
        processed.add(node);
        node.nodeValue = converted;
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
            // If it's already converted and matches the text, we could skip, 
            // but for simplicity we rely on cnToTw check
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

    let timeoutId: any;
    const observer = new MutationObserver((mutations) => {
      // Collect mutations and process in a batch to avoid layout thrashing
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        for (const mutation of mutations) {
          if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
            const node = mutation.target as Text;
            // Only convert if NOT our own change
            if (!processed.has(node)) {
              convertTextNode(node);
            } else {
              // Clear the flag so next external change WILL be processed
              processed.delete(node);
            }
          }
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              walkAndConvert(node);
            });
          }
        }
      }, 50); // Small delay to batch mutations
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [language]);

  return null;
}

