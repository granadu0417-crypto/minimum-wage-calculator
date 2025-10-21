// Cloudflare Pages Function - 최저시급 계산기 결과 공유 동적 OG 태그

const CRAWLER_PATTERNS = ['kakaotalk', 'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot', 'Slackbot', 'TelegramBot', 'WhatsApp', 'Pinterest', 'Google-InspectionTool', 'Googlebot', 'bingbot', 'Discordbot'];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some(pattern => ua.includes(pattern.toLowerCase()));
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function generateOGTags(urlParams) {
  const hourly = urlParams.get('hourly');
  const monthly = urlParams.get('monthly');
  const net = urlParams.get('net');

  if (!monthly || !net) return null;

  const hourlyFormatted = formatNumber(parseInt(hourly));
  const monthlyFormatted = formatNumber(parseInt(monthly));
  const netFormatted = formatNumber(parseInt(net));

  const shareTitle = `💰 나의 월급: ${netFormatted}원!`;
  const shareDescription = `시급 ${hourlyFormatted}원 → 월급 ${monthlyFormatted}원 → 실수령 ${netFormatted}원\n당신의 급여도 계산해보세요 👉`;

  return { title: shareTitle, description: shareDescription };
}

function injectOGTags(html, ogData) {
  if (!ogData) return html;
  let modifiedHtml = html.replace(/<meta property="og:.*?".*?>/g, '');
  const ogTags = `
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(ogData.title)}">
    <meta property="og:description" content="${escapeHtml(ogData.description)}">
    <meta property="og:url" content="https://minimum-wage-calculator.pages.dev/">
    <meta property="og:site_name" content="최저시급 계산기">
  `;
  modifiedHtml = modifiedHtml.replace('</head>', `${ogTags}\n</head>`);
  return modifiedHtml;
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export async function onRequest(context) {
  const { request, next } = context;
  const userAgent = request.headers.get('User-Agent') || '';
  const url = new URL(request.url);

  if (!isCrawler(userAgent)) return next();

  const ogData = generateOGTags(url.searchParams);
  if (!ogData) return next();

  const response = await next();
  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('text/html')) return response;

  let html = await response.text();
  html = injectOGTags(html, ogData);

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}
