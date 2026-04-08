import asyncio
import logging
import signal

import redis.asyncio as aioredis

from app.core.config import settings
from app.consumer.stream_consumer import StreamConsumer
from app.llm.client import OllamaClient


def _setup_logging() -> None:
    logging.basicConfig(
        level=settings.log_level.upper(),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


async def main() -> None:
    _setup_logging()
    logger = logging.getLogger(__name__)
    logger.info("Starting Chimera LLM Worker")

    redis = aioredis.from_url(settings.redis_url, decode_responses=False)
    llm = OllamaClient()

    loop = asyncio.get_running_loop()
    stop_event = asyncio.Event()

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop_event.set)

    consumer = StreamConsumer(redis=redis, llm=llm)

    consumer_task = asyncio.create_task(consumer.run())

    # Wait for either a stop signal or the consumer task to die unexpectedly.
    done, _ = await asyncio.wait(
        [consumer_task, asyncio.create_task(stop_event.wait())],
        return_when=asyncio.FIRST_COMPLETED,
    )

    if consumer_task in done and not consumer_task.cancelled():
        exc = consumer_task.exception()
        if exc:
            logger.critical("Consumer task died unexpectedly: %s", exc, exc_info=exc)
            raise SystemExit(1)

    logger.info("Shutdown signal received, stopping...")
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass

    await llm.aclose()
    await redis.aclose()
    logger.info("Shutdown complete")


if __name__ == "__main__":
    asyncio.run(main())
