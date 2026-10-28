-- User-facing slogan:「长期生意」→「自由生意」(a business that brings life freedom).
-- Article slug what-is-long-term-business is unchanged so existing links keep working.
-- Fresh databases get the new wording from seed/seed.sql; this updates rows already stored.

UPDATE articles
SET
  title = REPLACE(title, '长期生意', '自由生意'),
  summary = REPLACE(summary, '长期生意', '自由生意'),
  topic = REPLACE(topic, '长期生意', '自由生意'),
  tags = REPLACE(tags, '长期生意', '自由生意'),
  body = REPLACE(body, '长期生意', '自由生意')
WHERE title LIKE '%长期生意%'
   OR summary LIKE '%长期生意%'
   OR topic LIKE '%长期生意%'
   OR tags LIKE '%长期生意%'
   OR body LIKE '%长期生意%';

UPDATE resources
SET
  title = REPLACE(title, '长期生意', '自由生意'),
  summary = REPLACE(summary, '长期生意', '自由生意'),
  category = REPLACE(category, '长期生意', '自由生意'),
  body = REPLACE(body, '长期生意', '自由生意'),
  prompt = REPLACE(prompt, '长期生意', '自由生意')
WHERE title LIKE '%长期生意%'
   OR summary LIKE '%长期生意%'
   OR category LIKE '%长期生意%'
   OR body LIKE '%长期生意%'
   OR prompt LIKE '%长期生意%';

-- Smooth definitional sentences that would still describe the old term after a plain swap.
UPDATE articles SET
  title = REPLACE(title, '什么才叫自由生意（不是干很多年的同一个产品）', '什么才叫自由生意（能带来人生自由的生意）'),
  summary = REPLACE(summary, '什么才叫自由生意（不是干很多年的同一个产品）', '什么才叫自由生意（能带来人生自由的生意）'),
  body = REPLACE(body, '什么才叫自由生意（不是干很多年的同一个产品）', '什么才叫自由生意（能带来人生自由的生意）');

UPDATE articles SET
  summary = REPLACE(summary, '自由生意不是产品永远不变，而是围绕特定人群的持续需求，长期积累能力、信任与可重复交付。', '自由生意不是想停就停，也不是产品永远不变。它是能带来人生自由的生意：围绕特定人群的持续需求，积累能力、信任与可重复交付。'),
  body = REPLACE(body, '自由生意不是产品永远不变，而是围绕特定人群的持续需求，长期积累能力、信任与可重复交付。', '自由生意不是想停就停，也不是产品永远不变。它是能带来人生自由的生意：围绕特定人群的持续需求，积累能力、信任与可重复交付。');

UPDATE articles SET
  body = REPLACE(
    body,
    '一说「自由生意」，很多人会想到：做同一个产品很多年，或者押中一个永远不改的品类。自在星球的定义不同。',
    '一说「自由生意」，很多人会想到：想做什么就做什么，或者干脆不做了。也有人以为，要干很多年同一个产品才算数。自在星球的定义不同。'
  );

UPDATE articles SET
  body = REPLACE(
    body,
    '自由生意不是一项可以永远不变的产品，也不是简单地经营某个项目很多年。它是一种围绕特定人群的持续需求，长期积累专业能力、客户信任、交付经验和经营资产的方式。产品可以迭代，形态可以变；不变的是你对那群人、那类问题的长期承诺。',
    '自由生意，是一门能带来人生自由的生意。它不是想停就停，也不是一项可以永远不变的产品，更不是简单地经营某个项目很多年。它是一种围绕特定人群的持续需求，积累专业能力、客户信任、交付经验和经营资产的方式。产品可以迭代，形态可以变；不变的是：这件事服务真实的人，也让你的生活有选择。'
  );

UPDATE articles SET
  body = REPLACE(body, '少一条，就还只是一次生意或一段项目，还谈不上「长期」。', '少一条，就还只是一次生意或一段项目，还谈不上自由生意。');

UPDATE articles SET
  body = REPLACE(
    body,
    '找到自己愿意长期投入、别人持续需要、能够不断创造价值的方向——这才是「长期」二字真正指向的地方。',
    '找到自己愿意投入、别人持续需要、能够不断创造价值、也让人生更自由的方向——这才是「自由生意」真正指向的地方。'
  );

UPDATE articles SET
  body = REPLACE(
    body,
    '「自由生意」四个字，容易被听成融资、规模、赛道。在自在星球里，它更接近另一层意思：你愿意在未来很多年里反复做的事，能帮到真实的人，也能养得起自己的节奏。',
    '「自由生意」四个字，容易被听成随便做、想停就停。在自在星球里，它是一门能带来人生自由的生意：你愿意反复做、能帮到真实的人，也能养得起自己的节奏与选择。'
  );

UPDATE articles SET
  body = REPLACE(
    body,
    '定位是：帮助每个人找到属于自己自由生意的 AI 时代探索与成长生态。',
    '定位是：帮助每个人找到属于自己的自由生意——一门能带来人生自由的生意。这是 AI 时代的探索与成长生态。'
  );

UPDATE articles SET
  body = REPLACE(body, '两者一起，才配得上「长期」二字。', '两者一起，才配得上一门自由生意。');
