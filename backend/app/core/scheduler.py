from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = AsyncIOScheduler()


def start_scheduler():
    from app.scrapers.world_bank import scrape_world_bank
    from app.scrapers.index_mundi import scrape_index_mundi
    from app.scrapers.cbot import scrape_cbot
    from app.scrapers.bcr import scrape_bcr

    # Diario a las 7:00 UTC
    scheduler.add_job(scrape_cbot, CronTrigger(hour=7, minute=0), id="cbot_daily")
    scheduler.add_job(scrape_bcr, CronTrigger(hour=7, minute=30), id="bcr_daily")

    # Semanal los lunes
    scheduler.add_job(scrape_world_bank, CronTrigger(day_of_week="mon", hour=6), id="wb_weekly")
    scheduler.add_job(scrape_index_mundi, CronTrigger(day_of_week="mon", hour=6, minute=30), id="im_weekly")

    scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
