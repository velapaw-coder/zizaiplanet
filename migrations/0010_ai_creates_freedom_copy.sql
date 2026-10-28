-- Brand 2.0: align stored articles with「AI创造自由」.
-- Slugs stay the same so existing links keep working.
-- Fresh databases get the new wording from seed/seed.sql; this updates rows already stored.
-- The old sentences below are the search text, not the live brand line.

UPDATE articles SET
  summary = REPLACE(
    summary,
    '我们不是生意的标准答案，而是寻找自由生意的起点与同行家园——说清愿景，也说清不做的事。',
    '核心理念是 AI创造自由。这里是自由创造者的起点与同行家园——说清愿景，也说清不做的事。'
  ),
  body = REPLACE(
    body,
    '自在星球不是一门生意的标准答案。它希望成为一个人寻找自由生意的起点，也是愿意长期同行的人们能够持续交流和成长的家园。',
    '自在星球相信 AI创造自由。它不是一门生意的标准答案，而是自由创造者见自己、明其道、善用AI的起点，也是愿意长期同行的家园。'
  );

UPDATE articles SET
  body = REPLACE(
    body,
    '品牌主张很短：看见自己 · 连接同频 · 找到自由生意。定位是：帮助每个人找到属于自己的自由生意——一门能带来人生自由的生意。这是 AI 时代的探索与成长生态。生活愿景是：用 AI 创造价值，把生活过成自己喜欢的样子。共同价值观包括：真实、自在、长期主义、利他、开放、共同成长。',
    '核心理念是 AI创造自由。辨识句是：以道驭AI，以创造得自由。口号是：AI自由创造，创造自由生活。路径是：见自己 · 明其道 · 善用AI · 创造自由。自由生意，是一门能带来人生自由的生意。生活愿景是：用 AI 创造价值，把生活过成自己选择的样子。价值观是：顺势而为、以人为本、知行合一、利他共生、长期主义。'
  );

UPDATE articles SET
  body = REPLACE(
    body,
    '在自在星球，我们把整条路径说成三步：看见自己 · 连接同频 · 共创自由生意。第一步听起来慢，却是后面两步的地基。',
    '在自在星球，我们把整条路径收成十二个字：见自己 · 明其道 · 善用AI · 创造自由。见自己听起来慢，却是后面的地基。'
  );

UPDATE articles SET
  body = REPLACE(
    body,
    '看见自己 · 连接同频 · 找到自由生意。自在星球，与你同行。',
    '见自己 · 明其道 · 善用AI · 创造自由。自在星球，与你同行。'
  );
