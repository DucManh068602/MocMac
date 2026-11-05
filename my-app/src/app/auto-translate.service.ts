import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { I18nService } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class AutoTranslateService {
  private http = inject(HttpClient);
  private i18n = inject(I18nService);
  private router = inject(Router);
  private apiBase = 'http://localhost:3000';
  private cache = new Map<string, string>();
  private running = false;
  private rerun = false;
  private pendingTimer: any = null;

  init(): void {
    setTimeout(() => this.apply(), 0);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.schedule());
    window.addEventListener('mocmac-lang-change', () => this.schedule());
  }

  schedule(): void {
    clearTimeout(this.pendingTimer);
    this.pendingTimer = setTimeout(() => this.apply(), 120);
    // re-apply for async-rendered content (footer, product lists, lazy data)
    setTimeout(() => this.apply(), 600);
    setTimeout(() => this.apply(), 1600);
    setTimeout(() => this.apply(), 3500);
  }

  private getRoots(): Element[] {
    const roots = new Set<Element>();
    document.querySelectorAll('app-root, app-header-component, app-footer-component, header, footer, main, .auth-page, .auth-card, router-outlet').forEach(el => roots.add(el));
    const app = document.querySelector('app-root'); if (app) roots.add(app);
    return [...roots];
  }

  private collect(root: Element): { node: Text; orig: string; trimmed: string }[] {
    const out: { node: Text; orig: string; trimmed: string }[] = [];
    const skip = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA']);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        const p = n.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (skip.has(p.tagName)) return NodeFilter.FILTER_REJECT;
        if (p.closest('[data-no-translate], .admin-shell, .ai-window, input, select, option')) return NodeFilter.FILTER_REJECT;
        const raw = n.nodeValue || '';
        const t = raw.replace(/\s+/g, ' ').trim();
        if (!t || t.length < 2) return NodeFilter.FILTER_REJECT;
        if (/^[\d\s.,:%+đ$€£()\-/·•|]+$/i.test(t)) return NodeFilter.FILTER_REJECT;
        if (/^[\W_]+$/.test(t)) return NodeFilter.FILTER_REJECT;
        // likely already English (no Vietnamese diacritics) when target en? skip translating ASCII-heavy UI from libs? keep translating to be safe except very short
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const tn = node as Text;
      if ((tn as any).__i18nOrig == null) (tn as any).__i18nOrig = tn.nodeValue;
      const orig = (tn as any).__i18nOrig as string;
      const trimmed = String(orig).replace(/\s+/g, ' ').trim();
      out.push({ node: tn, orig, trimmed });
    }
    return out;
  }

  private restore(roots: Element[]): void {
    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const tn = node as Text;
        if ((tn as any).__i18nOrig != null) tn.nodeValue = (tn as any).__i18nOrig;
      }
      root.querySelectorAll('[data-i18n-orig-placeholder]').forEach(el => { const o = el.getAttribute('data-i18n-orig-placeholder'); if (o != null) el.setAttribute('placeholder', o); });
      root.querySelectorAll('[data-i18n-orig-aria]').forEach(el => { const o = el.getAttribute('data-i18n-orig-aria'); if (o != null) el.setAttribute('aria-label', o); });
      root.querySelectorAll('[data-i18n-orig-title]').forEach(el => { const o = el.getAttribute('data-i18n-orig-title'); if (o != null) el.setAttribute('title', o); });
      root.querySelectorAll('[data-i18n-orig-value]').forEach(el => { const o = el.getAttribute('data-i18n-orig-value'); if (o != null && (el as HTMLInputElement).type === 'submit') (el as HTMLInputElement).value = o; });
    }
  }

  async apply(): Promise<void> {
    if (this.running) { this.rerun = true; return; }
    const roots = this.getRoots();
    const lang = this.i18n.lang();
    if (lang === 'vi') { this.restore(roots); this.rerun = false; return; }
    this.running = true; this.rerun = false;
    try {
      const items = roots.flatMap(r => this.collect(r));
      const attrItems: { el: Element; attr: string; data: string; orig: string; trimmed: string }[] = [];
      for (const root of roots) {
        root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
          if (el.closest('[data-no-translate], .admin-shell, .ai-window')) return;
          const o = el.getAttribute('data-i18n-orig-placeholder') ?? el.getAttribute('placeholder') ?? '';
          if (o.trim().length < 2) return; el.setAttribute('data-i18n-orig-placeholder', o);
          attrItems.push({ el, attr: 'placeholder', data: 'data-i18n-orig-placeholder', orig: o, trimmed: o.replace(/\s+/g,' ').trim() });
        });
        root.querySelectorAll('[aria-label]').forEach(el => {
          if (el.closest('[data-no-translate], .admin-shell, .ai-window')) return;
          const o = el.getAttribute('data-i18n-orig-aria') ?? el.getAttribute('aria-label') ?? '';
          if (o.trim().length < 2) return; el.setAttribute('data-i18n-orig-aria', o);
          attrItems.push({ el, attr: 'aria-label', data: 'data-i18n-orig-aria', orig: o, trimmed: o.replace(/\s+/g,' ').trim() });
        });
        root.querySelectorAll('input[type="submit"], button[data-translate-value]').forEach(el => {
          if (el.closest('[data-no-translate], .admin-shell, .ai-window')) return;
          const v = (el as HTMLInputElement).value; if (!v?.trim()) return;
          const o = el.getAttribute('data-i18n-orig-value') ?? v; el.setAttribute('data-i18n-orig-value', o);
          attrItems.push({ el, attr: 'value', data: 'data-i18n-orig-value', orig: o, trimmed: o.replace(/\s+/g,' ').trim() });
        });
      }
      const unique = [...new Set([...items.map(i=>i.trimmed), ...attrItems.map(a=>a.trimmed)].filter(Boolean))].slice(0, 800);
      const missing = unique.filter(s => !this.cache.has(`en::${s}`));
      for (let i = 0; i < missing.length && i < 240; i += 30) {
        const batch = missing.slice(i, i + 30);
        try {
          const r: any = await firstValueFrom(this.http.post(`${this.apiBase}/api/ai/translate`, { target: 'en', texts: batch }));
          const tr = Array.isArray(r?.translations) ? r.translations : [];
          batch.forEach((s, idx) => {
            const v = String(tr[idx] || '').trim();
            // don't permanently cache failures/same-text for likely translatable strings
            if (v && v !== s) this.cache.set(`en::${s}`, v);
          });
        } catch (e) {
          console.warn('AutoTranslate batch failed', e);
        }
      }
      const tr = (t: string) => this.cache.get(`en::${t}`) || t;
      items.forEach(({ node, orig, trimmed }) => {
        const v = tr(trimmed);
        if (!v || v === trimmed) return;
        // preserve leading/trailing whitespace
        const lead = orig.match(/^\s*/)?.[0] || '';
        const tail = orig.match(/\s*$/)?.[0] || '';
        node.nodeValue = lead + v + tail;
      });
      attrItems.forEach(({ el, attr, trimmed }) => { const v = tr(trimmed); if (v && v !== trimmed) el.setAttribute(attr, v); });
    } catch (e) {
      console.warn('AutoTranslate apply error', e);
    } finally {
      this.running = false;
      if (this.rerun || this.i18n.lang() === 'en') { this.rerun = false; setTimeout(() => this.apply(), 80); }
    }
  }
}
