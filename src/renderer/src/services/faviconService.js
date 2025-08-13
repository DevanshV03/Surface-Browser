// renderer/src/services/faviconService.js
import { ICON_URLS } from '../config/constants';
import { DEFAULT_TAB_DATA } from '../config/constants';

export class FaviconService {
    constructor(size = ICON_URLS.SIZE) {
        this.size = size;
        this.cache = new Map();
    }

    async getFaviconUrl(pageUrl) {
        try {
            const domain = this.extractDomain(pageUrl);
            if (!domain) return DEFAULT_TAB_DATA.FAVICON;

           
            if (this.cache.has(domain)) {
                return this.cache.get(domain);
            }

            const googleUrl = `${ICON_URLS.PRIMARY}?domain=${domain}&sz=${this.size}`;
            const ok = await this.checkImage(googleUrl, 1000);
            
         
            const result = ok ? googleUrl : DEFAULT_TAB_DATA.FAVICON;
            this.cache.set(domain, result);
            return result;
        } catch (error) {
            console.log('FaviconService error:', error);
            return DEFAULT_TAB_DATA.FAVICON;
        }
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return null;
        }
    }

    checkImage(src, timeoutMs = 1000) {  
        return new Promise((resolve) => {
            const img = new Image();
            let settled = false;

            const finish = (val) => {
                if (settled) return;
                settled = true;
                resolve(val);
            };

            img.onload = () => finish(true);
            img.onerror = () => finish(false);
            img.src = src;

            setTimeout(() => finish(false), timeoutMs);
        });
    }
}
