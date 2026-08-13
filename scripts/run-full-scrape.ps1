$env:HORIOTOI_CONCURRENCY = '8'
Remove-Item Env:HORIOTOI_LIMIT -ErrorAction SilentlyContinue
npm run scrape -- --resume *> scrape.log
