$env:HORIOTOI_CONCURRENCY = '2'
Remove-Item Env:HORIOTOI_LIMIT -ErrorAction SilentlyContinue
npm run scrape -- --resume *> scrape-final.log
