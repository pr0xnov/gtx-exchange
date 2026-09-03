import { describe, expect, it } from "vitest";
import { parseFeed } from "@/lib/news/normalize";

function rss(items: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Test Feed</title>
    ${items}
  </channel>
</rss>`;
}

describe("parseFeed — happy path", () => {
  it("extracts title/link/description/image/date from a well-formed item", () => {
    const xml = rss(`
      <item>
        <title><![CDATA[Bitcoin hits new high]]></title>
        <link>https://example.com/bitcoin-high</link>
        <description><![CDATA[<p>Bitcoin <b>surged</b> today.</p>]]></description>
        <media:content url="https://cdn.example.com/img.jpg" type="image/*"/>
        <pubDate>Mon, 31 Aug 2026 15:33:14 +0000</pubDate>
      </item>
    `);
    const [article] = parseFeed(xml, "TestSource");
    expect(article).toBeDefined();
    expect(article!.title).toBe("Bitcoin hits new high");
    expect(article!.url).toBe("https://example.com/bitcoin-high");
    expect(article!.description).toBe("Bitcoin surged today.");
    expect(article!.image).toBe("https://cdn.example.com/img.jpg");
    expect(article!.source).toBe("TestSource");
    expect(article!.publishedAt).toBe(
      new Date("Mon, 31 Aug 2026 15:33:14 +0000").toISOString()
    );
  });

  it("falls back to enclosure, then media:thumbnail, when media:content is absent", () => {
    const withEnclosure = rss(`
      <item>
        <title>Story A</title>
        <link>https://example.com/a</link>
        <enclosure url="https://cdn.example.com/enclosure.jpg" type="image/jpeg"/>
      </item>
    `);
    expect(parseFeed(withEnclosure, "S")[0]!.image).toBe(
      "https://cdn.example.com/enclosure.jpg"
    );

    const withThumbnail = rss(`
      <item>
        <title>Story B</title>
        <link>https://example.com/b</link>
        <media:thumbnail url="https://cdn.example.com/thumb.jpg"/>
      </item>
    `);
    expect(parseFeed(withThumbnail, "S")[0]!.image).toBe(
      "https://cdn.example.com/thumb.jpg"
    );
  });

  it("has no image field when none of the sources provide one", () => {
    const xml = rss(`
      <item>
        <title>No image story</title>
        <link>https://example.com/no-image</link>
      </item>
    `);
    expect(parseFeed(xml, "S")[0]!.image).toBeUndefined();
  });
});

describe("parseFeed — untrusted-content safety", () => {
  it("strips HTML tags from title and description, never renders raw markup", () => {
    const xml = rss(`
      <item>
        <title><![CDATA[<b>Bold</b> title]]></title>
        <link>https://example.com/x</link>
        <description><![CDATA[<script>alert(1)</script>Plain text here]]></description>
      </item>
    `);
    const [article] = parseFeed(xml, "S");
    expect(article!.title).toBe("Bold title");
    expect(article!.description).not.toContain("<script>");
    expect(article!.description).toContain("Plain text here");
  });

  it("decodes common HTML entities", () => {
    const xml = rss(`
      <item>
        <title>George Santos Bet on Whether He&#39;d Show Up</title>
        <link>https://example.com/entities</link>
      </item>
    `);
    expect(parseFeed(xml, "S")[0]!.title).toBe(
      "George Santos Bet on Whether He'd Show Up"
    );
  });

  it("rejects an item whose link is not http/https", () => {
    const xml = rss(`
      <item>
        <title>Bad link</title>
        <link>javascript:alert(1)</link>
      </item>
    `);
    expect(parseFeed(xml, "S")).toHaveLength(0);
  });

  it("never uses a non-http(s) image URL, even if present in the feed", () => {
    const xml = rss(`
      <item>
        <title>Bad image</title>
        <link>https://example.com/ok</link>
        <media:content url="javascript:alert(1)"/>
      </item>
    `);
    expect(parseFeed(xml, "S")[0]!.image).toBeUndefined();
  });

  it("skips an item with no title, and one with no link at all, without throwing", () => {
    const xml = rss(`
      <item>
        <link>https://example.com/no-title</link>
      </item>
      <item>
        <title>No link here</title>
      </item>
      <item>
        <title>Valid one</title>
        <link>https://example.com/valid</link>
      </item>
    `);
    const articles = parseFeed(xml, "S");
    expect(articles).toHaveLength(1);
    expect(articles[0]!.title).toBe("Valid one");
  });

  it("falls back to now() for a missing or unparsable pubDate, rather than throwing", () => {
    const xml = rss(`
      <item>
        <title>No date</title>
        <link>https://example.com/no-date</link>
      </item>
    `);
    const before = Date.now();
    const [article] = parseFeed(xml, "S");
    const publishedMs = new Date(article!.publishedAt).getTime();
    expect(publishedMs).toBeGreaterThanOrEqual(before);
  });

  it("returns an empty array (not a throw) for completely malformed XML", () => {
    expect(parseFeed("not xml at all <<<", "S")).toEqual([]);
    expect(parseFeed("", "S")).toEqual([]);
  });

  it("handles a single <item> (not an array) the same as multiple", () => {
    const xml = rss(
      `<item><title>Only one</title><link>https://example.com/one</link></item>`
    );
    const articles = parseFeed(xml, "S");
    expect(articles).toHaveLength(1);
    expect(articles[0]!.title).toBe("Only one");
  });
});
