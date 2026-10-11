"""Scrape every book by أ. حلمي القمص يعقوب listed on st-takla.org into
website/public/data/books/<id>.json (same format as scrape_book.py).

Usage:
    python scrape_all.py            # skip books whose JSON already exists
    python scrape_all.py --force    # re-scrape everything
    python scrape_all.py <id> ...   # only these books (always re-scraped)

Book list: https://st-takla.org/books/helmy-elkommos/ (plus NT volumes 9-10, listed only
on the series index biblical-criticism/new-testament/index-new-testament.html)
"""
import json
import os
import sys

from scrape_book import fetch, scrape, toc_links

SITE = "https://st-takla.org/books/helmy-elkommos/"
SIDI_BESHR = "https://st-takla.org/Full-Free-Coptic-Books/FreeCopticBooks-021-Sts-Church-Sidi-Beshr/"
CRIT = SITE + "biblical-criticism/"
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "website", "public", "data", "books")

# (id, index URL, display title); list order = library order
BOOKS = [
    # سلسلة اقرأ وأفهم: إيمان كنيستنا
    ("helmi-bible-distortion", SIDI_BESHR + "001-Al-Ketab-Al-Mokaddas-Hal-Yo3kal-Ta7rifo/Distortion-of-the-Holy-Bible-Is-It-Possible__00-index.html", "الكتاب المقدس... هل يُعقل تحريفه؟"),
    ("helmi-trinity-reason", SITE + "trinity/index.html", "التثليث والتوحيد... هل ضد العقل؟"),
    ("helmi-addiction", SITE + "addiction/index.html", "الدرهم المفقود... مَنْ يجده؟ (الإدمان: أسبابه وآثاره، الوقاية والعلاج)"),
    ("helmi-unbelievers-salvation", SITE + "unbelievers/index.html", "عقيدة خلاص غير المؤمنين"),
    ("helmi-revelation", SITE + "revelation/index.html", "مفهوم الوحي والعصمة في الكتاب المقدس"),
    ("helmi-atheism", SITE + "atheism/index.html", "رحلة إلى قلب الإلحاد"),
    ("helmi-ot-god", SITE + "ot-god/index.html", "هل إله العهد القديم إله جزار وعُنصري؟! وهل شريعته شريعة الغاب؟!"),
    # سلسلة اقرأ وأفهم: دراسات إيمانية
    ("helmi-bible-barnabas-questions", SITE + "bible-gospel/index.html", "أسئلة حول صحة الكتاب المقدس + أسئلة حول خرافة إنجيل برنابا"),
    ("helmi-trinity-questions", SITE + "trinity-and-unity/index.html", "أسئلة حول التثليث والتوحيد"),
    ("helmi-incarnation-questions", SIDI_BESHR + "002-Hatmeyat-Al-Tagasod-Al-Ilahy/Inevitability-of-the-Incarnation__00-index.html", "أسئلة حول التجسد الإلهي"),
    ("helmi-divinity-questions", SITE + "divinity-of-christ/index.html", "أسئلة حول ألوهية المسيح"),
    ("helmi-cross-questions", SITE + "cross/index.html", "أسئلة حول الصليب"),
    # سلسلة اقرأ وأفهم: روايات إيمانية
    ("helmi-with-him", SITE + "with-him/index.html", "هناك كنت معه"),
    ("helmi-galatians", "https://st-takla.org/bible/commentary/ar/nt/helmy-elkomos/galatians/index.html", "تفسير رسالة غلاطية"),
    # سلسلة اقرأ وأفهم: استقامة كنيستنا
    ("helmi-catholic", SITE + "catholic/index.html", "يا إخوتنا الكاثوليك.. متى يكون اللقاء؟"),
    ("helmi-protestant", SITE + "protestant/index.html", "يا إخوتنا البروتستانت... هلموا نتحاور"),
    ("helmi-adventists", SITE + "seventh-day-adventist/index.html", "الأدفنتست... ظلمة الموت"),
    ("helmi-crooked-denominations", SITE + "crooked-denominations/index.html", "المذاهب الحديثة المنحرفة"),
    ("helmi-satanism", SIDI_BESHR + "003-3ebadat-Al-Shaitan/Satanism-000-index.html", "عبادات الشيطان وسلطان القديسين"),
    # مدارس النقد والتشكيك والرد عليها: العهد القديم
    ("helmi-criticism-ot-01", CRIT + "index1.html", "مدارس النقد ج1: مقدمة للنقد الكتابي"),
    ("helmi-criticism-ot-02", CRIT + "index2.html", "مدارس النقد ج2: مقدمة للنقد الكتابي (نقد الإنجيل)"),
    ("helmi-criticism-ot-03", CRIT + "index3.html", "مدارس النقد ج3: سفر التكوين (1) أصل الكون وأصل الإنسان"),
    ("helmi-criticism-ot-04", CRIT + "index4.html", "مدارس النقد ج4: سفر التكوين (2) هل أخذ سفر التكوين من الأساطير؟"),
    ("helmi-criticism-ot-05", CRIT + "index5.html", "مدارس النقد ج5: سفر التكوين (3) أسئلة على الطريق"),
    ("helmi-criticism-ot-06", CRIT + "index6.html", "مدارس النقد ج6: سفرا الخروج واللاويين"),
    ("helmi-criticism-ot-07", CRIT + "index7.html", "مدارس النقد ج7: سفرا العدد والتثنية"),
    ("helmi-criticism-ot-08", CRIT + "index8.html", "مدارس النقد ج8: أسفار يشوع والقضاة وراعوث"),
    ("helmi-criticism-ot-09", CRIT + "index9.html", "مدارس النقد ج9: سفرا صموئيل الأول والثاني"),
    ("helmi-criticism-ot-10", CRIT + "index10.html", "مدارس النقد ج10: سفرا الملوك الأول والثاني"),
    ("helmi-criticism-ot-11", CRIT + "index11.html", "مدارس النقد ج11: أخبار الأيام وعزرا ونحميا وأستير"),
    ("helmi-criticism-ot-12", CRIT + "index12.html", "مدارس النقد ج12: سفر أيوب"),
    ("helmi-criticism-ot-13", CRIT + "index13.html", "مدارس النقد ج13: سفر المزامير (1) مز 1-41"),
    # مدارس النقد والتشكيك والرد عليها: العهد الجديد
    ("helmi-criticism-nt-01", CRIT + "new-testament/index1.html", "مدارس النقد - العهد الجديد ج1: مقدمة (1)"),
    ("helmi-criticism-nt-02", CRIT + "new-testament/index2.html", "مدارس النقد - العهد الجديد ج2: مقدمة (2)"),
    ("helmi-criticism-nt-03", CRIT + "new-testament/index3.html", "مدارس النقد - العهد الجديد ج3: إنجيل متى (1) ص1-5"),
    ("helmi-criticism-nt-04", CRIT + "new-testament/index4.html", "مدارس النقد - العهد الجديد ج4: إنجيل متى (2) ص6-21"),
    ("helmi-criticism-nt-05", CRIT + "new-testament/index5.html", "مدارس النقد - العهد الجديد ج5: إنجيل متى (3) ص22-28"),
    ("helmi-criticism-nt-06", CRIT + "new-testament/index6.html", "مدارس النقد - العهد الجديد ج6: إنجيل مرقس"),
    ("helmi-criticism-nt-07", CRIT + "new-testament/index7.html", "مدارس النقد - العهد الجديد ج7: إنجيل لوقا"),
    ("helmi-criticism-nt-08", CRIT + "new-testament/index8.html", "مدارس النقد - العهد الجديد ج8: إنجيل يوحنا (1)"),
    ("helmi-criticism-nt-09", CRIT + "new-testament/index9.html", "مدارس النقد - العهد الجديد ج9: إنجيل يوحنا (2) ص1-7"),
    ("helmi-criticism-nt-10", CRIT + "new-testament/index10.html", "مدارس النقد - العهد الجديد ج10: إنجيل يوحنا (3) ص8-21"),
    # روايات
    ("helmi-macarius", SITE + "macarius/index.html", "القديس مكاريوس السكندري"),
]

# Series/collection pages that share a folder with books; never part of a book.
SERIES_PAGES = {
    SITE + "trinity-and-unity/index-2-books.html",
    CRIT + "index.html",
    CRIT + "index-old-testament.html",
    CRIT + "index-bunlge.html",
    CRIT + "new-testament/index-new-testament.html",
}


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv
    todo = [b for b in BOOKS if (b[0] in args if args else force or not os.path.exists(os.path.join(OUT_DIR, b[0] + ".json")))]
    if not todo:
        print("nothing to do", file=sys.stderr)
        return

    # Each book's own entry pages; a book stops where another book's begins.
    entries = {}
    for book_id, url, _ in BOOKS:
        entries[book_id] = {url} | {u for u, _ in toc_links(fetch(url), url)}

    for n, (book_id, url, title) in enumerate(BOOKS):
        if (book_id, url, title) not in todo:
            continue
        stop = set(SERIES_PAGES)
        for other, pages in entries.items():
            if other != book_id:
                stop |= pages
        stop -= entries[book_id] - {url}
        print(f"=== {book_id}: {title}", file=sys.stderr)
        book = scrape(url, stop)
        book["display_title"] = title
        book["order"] = (n + 1) * 10
        out = os.path.join(OUT_DIR, book_id + ".json")
        with open(out, "w", encoding="utf-8") as f:
            json.dump(book, f, ensure_ascii=False, indent=2)
        paragraphs = sum(len(c["paragraphs"]) for c in book["chapters"])
        print(f"=== wrote {out}: {book['chapter_count']} chapters, {paragraphs} paragraphs", file=sys.stderr)


if __name__ == "__main__":
    main()
