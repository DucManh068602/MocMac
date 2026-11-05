import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError, shareReplay } from 'rxjs';
import { I18nService } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class ContentTranslateService {
  private http = inject(HttpClient);
  private i18n = inject(I18nService);
  private cache = new Map<string, Observable<string>>();
  private apiBase = 'http://localhost:3000';

  /** Translate plain text to current language (source assumed vi). Returns original for vi or on error. */
  t$(text: string | null | undefined): Observable<string> {
    const src = String(text || '').trim();
    if (!src) return of('');
    if (this.i18n.lang() === 'vi') return of(src);
    const key = `en::${src}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    const req$ = this.http.post<{ translations?: string[] }>(`${this.apiBase}/api/ai/translate`, { target: 'en', texts: [src] }).pipe(
      map(r => String(r?.translations?.[0] || src)),
      catchError(() => of(src)),
      shareReplay(1)
    );
    if (this.cache.size < 1500) this.cache.set(key, req$);
    return req$;
  }

  tMany$(texts: (string | null | undefined)[]): Observable<string[]> {
    const src = texts.map(t => String(t || '').trim());
    if (this.i18n.lang() === 'vi' || !src.some(Boolean)) return of(src);
    const missing: { i: number; s: string }[] = [];
    const out = src.slice();
    src.forEach((s, i) => { if (!s) return; const c = this.cache.get(`en::${s}`); if (!c) missing.push({ i, s }); });
    // resolve cached individually; fetch missing in one batch
    const fillCached = () => Promise.all(src.map(async (s, i) => { if (!s) return; const c = this.cache.get(`en::${s}`); if (c) out[i] = await new Promise<string>(res => c.subscribe(v => res(v))); }));
    if (!missing.length) return new Observable<string[]>(sub => { fillCached().then(() => { sub.next(out); sub.complete(); }); });
    const batch$ = this.http.post<{ translations?: string[] }>(`${this.apiBase}/api/ai/translate`, { target: 'en', texts: missing.map(m => m.s) }).pipe(
      map(r => (r?.translations || []).map((v, i) => String(v || missing[i]?.s || ''))),
      catchError(() => of(missing.map(m => m.s))),
      shareReplay(1)
    );
    return new Observable<string[]>(sub => {
      batch$.subscribe(tr => {
        missing.forEach((m, idx) => {
          const val = tr[idx] || m.s;
          out[m.i] = val;
          if (!this.cache.has(`en::${m.s}`) && this.cache.size < 1500) this.cache.set(`en::${m.s}`, of(val));
        });
        fillCached().then(() => { sub.next(out); sub.complete(); });
      });
    });
  }
}
