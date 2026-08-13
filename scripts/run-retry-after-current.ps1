while (Get-Process -Id 706784 -ErrorAction SilentlyContinue) {
  Start-Sleep -Seconds 20
}
$env:HORIOTOI_CONCURRENCY = '12'
Remove-Item Env:HORIOTOI_LIMIT -ErrorAction SilentlyContinue
npm run scrape -- --resume *> scrape-retry.log
