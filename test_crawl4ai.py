import asyncio
from crawl4ai import AsyncWebCrawler

async def main():
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url="https://example.com")
        print(f"URL: {result.url}")
        print(f"Markdown Content Snippet: {result.markdown[:100]}...")
        # Since Crawl4AI returns markdown, we can find the heading
        # Or we can look at the result object's other fields if available
        # In newer versions, result has metadata or content attributes
        print(f"Success: {result.success}")

if __name__ == "__main__":
    asyncio.run(main())
