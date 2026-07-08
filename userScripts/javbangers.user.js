// ==UserScript==
// @name         JavBangers
// @namespace    gmspider
// @version      2026.07.08
// @description  JavBangers GMSpider
// @author       Luomo
// @match        https://www.javbangers.com/*
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';

    const GMSpiderArgs = {};
    if (typeof GmSpiderInject !== 'undefined') {
        let args = JSON.parse(GmSpiderInject.GetSpiderArgs());
        GMSpiderArgs.fName = args.shift();
        GMSpiderArgs.fArgs = args;
    } else {
        GMSpiderArgs.fName = "homeContent";
        GMSpiderArgs.fArgs = [true];
    }
    Object.freeze(GMSpiderArgs);

    function listVideos() {
        const seen = new Set();
        const items = [];
        jQuery('.video-item').each(function () {
            const link = jQuery(this).find('a.thumb[href*="/video/"]');
            const href = link.attr('href');
            if (!href) return;
            const m = href.match(/\/video\/(\d+)\//);
            const id = m ? m[1] : '';
            if (!id || seen.has(id)) return;
            seen.add(id);
            const img = link.find('img').first();
            const title = jQuery(this).find('p.inf a').text().trim() || link.attr('title') || id;
            const dur = jQuery(this).find('.durations').text().replace(/[^0-9:]/g, '').trim();
            items.push({
                vod_id: id,
                vod_name: title,
                vod_pic: img.attr('src') || '',
                vod_remarks: dur,
            });
        });
        return items;
    }

    function getPageCount() {
        let max = 1;
        jQuery('.pagination a').each(function () {
            const n = parseInt(jQuery(this).text());
            if (n > max) max = n;
        });
        return max;
    }

    const GmSpider = {
        homeContent: function () {
            return {
                class: [
                    {type_id: 'latest-updates', type_name: '最新'},
                    {type_id: 'top-rated', type_name: '高分'},
                    {type_id: 'most-popular', type_name: '热门'},
                    {type_id: 'categories', type_name: '分类'},
                    {type_id: 'models', type_name: '女优'},
                ],
                list: listVideos(),
                filters: {},
            };
        },

        categoryContent: function () {
            return { list: listVideos(), pagecount: getPageCount(), page: parseInt(arguments[1]) || 1 };
        },

        detailContent: function (ids) {
            const vid = Array.isArray(ids) ? ids[0] : ids;
            const name = jQuery('h1,h4').first().text().trim() || vid;
            const cover = jQuery('meta[property="og:image"]').attr('content') || '';
            const actors = [], tags = [];
            jQuery('a[href*="/models/"]').each(function () { const t=jQuery(this).text().trim(); if(t!=='Models') actors.push(t); });
            jQuery('a[href*="/tags/"],a[href*="/categories/"]').each(function () { const t=jQuery(this).text().trim(); if(t!=='Tags'&&t!=='Categories') tags.push(t); });
            return {
                list: [{
                    vod_id: vid,
                    vod_name: name,
                    vod_pic: cover,
                    vod_actor: actors.join(' '),
                    vod_remarks: tags.join(','),
                    vod_play_data: [{
                        from: 'JavBangers',
                        media: [{
                            name: name,
                            type: 'webview',
                            ext: { replace: { pathname: vid } }
                        }]
                    }]
                }]
            };
        },

        playerContent: function () { return { type: 'match' }; },

        searchContent: function () {
            return { list: listVideos(), pagecount: 1, page: 1 };
        },
    };

    $(function () {
        const fn = GmSpider[GMSpiderArgs.fName];
        const result = fn ? fn(...GMSpiderArgs.fArgs) : {};
        if (typeof GmSpiderInject !== 'undefined') {
            GmSpiderInject.SetSpiderResult(JSON.stringify(result));
        }
    });
})();
