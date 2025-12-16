'use client';

import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { cnToTw } from '@/lib/zh-convert';

function shouldSkipNode(node: Node): boolean {
  const parent = node.parentElement;
  if (!parent) return true;
  const tag = parent.tagName;
  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return true;
  if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'CODE' || tag === 'PRE') return true;
  if (parent.closest('[data-no-zhconvert="true"]')) return true;
  return false;
}

function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

export default function TraditionalChineseAutoConvert() {
  const { language } = useI18n();

  useEffect(() => {
    if (language !== 'zh-TW') return;

    const processed = new WeakSet<Node>();

    const convertTextNode = (node: Text) => {
      if (processed.has(node)) return;
      if (shouldSkipNode(node)) return;
      const value = node.nodeValue;
      if (!value || !containsChinese(value)) return;
      const converted = cnToTw(value);
      if (converted !== value) node.nodeValue = converted;
      processed.add(node);
    };

    const walkAndConvert = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let current: Node | null;
      // eslint-disable-next-line no-cond-assign
      while ((current = walker.nextNode())) {
        convertTextNode(current as Text);
      }
    };

    walkAndConvert(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
          convertTextNode(mutation.target as Text);
        }
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              convertTextNode(node as Text);
            } else {
              walkAndConvert(node);
            }
          });
        }
      }
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

