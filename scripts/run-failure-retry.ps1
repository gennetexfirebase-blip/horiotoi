$env:HORIOTOI_CONCURRENCY = '4'
$env:HORIOTOI_ATTEMPTS = '2'
node scripts\scrape-archive.mjs --local-index --resume --failures-only *> scrape-retry.log
