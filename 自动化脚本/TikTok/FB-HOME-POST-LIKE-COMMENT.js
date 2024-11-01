const likeRate = Number('$${讚機率}');
const commentRate = Number('$${評論機率}');
const link = 'https://www.facebook.com/';
const commentFile = '$${評論文案}';
const total = Number('$${閱讀帖子數}');
const shutdown = '$${執行完}' == 'off';

try {
  let comments = [];
  if (fs.existsSync(commentFile)) {
    const text = fs.readFileSync(commentFile, 'utf-8');
    comments = text.split('\n');
  } else {
    comments.push(commentFile);
  }
  if (commentFile == 'off') {
    comments = [];
  }
  logger(
    `- 閱讀帖子數: ${total}, 可用评论数: ${comments.length}, 讚機率: ${likeRate}%, 評論機率: ${commentRate}% -`,
  );

  const stats = {
    like: 0,
    comment: 0,
  };

  const screenshot = async (
    pageLocator,
    msg = 'screenshot',
    options = { type: 'png' },
  ) => {
    const file = `${NestReportPath}/${v4()}.${options.type}`;
    await pageLocator.screenshot({ ...options, path: file });
    logs.push({
      response: 1,
      msg,
      img: file,
    });
  };

  const sleep = async (ms) => {
    const rand = RandomNum(800, 1200) - 1000;
    return new Promise((resolve) => setTimeout(resolve, ms + rand));
  };

  const getDialogLocator = async (page) => {
    for (const li of await page.locator("[role='dialog']").all()) {
      const isVisible = await nestIsVisible(li, 5000);
      if (isVisible) {
        return li;
      }
    }
    return null;
  };

  const closeAllDialog = async (page) => {
    const getCloseBtnLocator = async (page) => {
      const dialogLocator = await getDialogLocator(page);
      if (!dialogLocator) {
        return null;
      }
      const newCloseBtnLocator = dialogLocator
        .locator("[role='button'] svg g g")
        .first();
      if (await nestIsVisible(newCloseBtnLocator)) {
        return newCloseBtnLocator;
      }
      return dialogLocator.locator("[aria-label][role='button'] i").first();
    };
    try {
      const closeDialogBtnLocator = await getCloseBtnLocator(page);
      if (closeDialogBtnLocator)
        await closeDialogBtnLocator.click({ timeout: 3000 });
    } catch (error) {
      logger('close all msg dialog err: ', error);
    }
  };

  const scrollPageSs = () => {
    const operation = '+';
    const screenN = 1;
    const sscript = `window.scroll({
    top: document.documentElement.scrollTop ${operation} document.documentElement.clientHeight / ${screenN},
    left: 0,
    behavior: "smooth",
  });`;
    return sscript;
  };

  const isHit = (x) => {
    // 生成0到99之间的随机数
    var random = Math.floor(Math.random() * 100);
    // 判断是否命中，命中概率为x%
    if (random < x) {
      return true;
    } else {
      return false;
    }
  };

  const likePost = async (page, index) => {
    try {
      const articleLocator = await getArticleLocator(page, index);
      const likeButtonLocator = articleLocator
        .locator(
          "[data-visualcompletion] [aria-label][role='button'] span[dir='auto']",
        )
        .first();
      // 无论是否点赞或评论，都需要滚动到元素位置
      await likeButtonLocator.waitFor({ timeout: 10000 });
      await likeButtonLocator.scrollIntoViewIfNeeded({ timeout: 5000 });
      await sleep(2000);
      if (isHit(likeRate)) {
        await likeButtonLocator.hover({ timeout: 5000 });
        await sleep(800);
        // await likeButtonLocator.click({ timeout: 5000 });
        // await sleep(2000);
        const clickIconRand = 0; // RandomNum(0, 6);
        const likeIconLocator = page
          .locator(".__fb-light-mode [role='button'][tabindex='0'] canvas")
          .nth(clickIconRand);
        await likeIconLocator.waitFor({ timeout: 10000 });
        await sleep(2000);
        await likeIconLocator.click({ timeout: 5000 });
        stats.like++;
        logger(`- 第 ${index + 1} 条点赞成功 - `);

        await sleep(2000);
        // await screenshot(articleLocator, 'Like', {
        //   quality: 20,
        //   type: 'jpeg',
        // });
        // const tmpLocator = articleLocator
        //   .locator(
        //     "div[data-visualcompletion='ignore-dynamic'] [aria-label][role='button']",
        //   )
        //   .nth(1);
        // if (await nestIsVisible(tmpLocator)) {
        //   await screenshot(tmpLocator);
        // }
      }
      return true;
    } catch (error) {
      logger(`- error - `, error);
      return false;
    }
  };

  const commentPost = async (page, index) => {
    try {
      if (comments.length <= 0) {
        logger(`- 没有可用評論文案, 忽略 - `);
        return;
      }
      const articleLocator = await getArticleLocator(page, index);
      const commentButtonLocator = articleLocator
        .locator(
          "[data-visualcompletion] [aria-label][role='button'] span[dir='auto']",
        )
        .nth(1);
      await commentButtonLocator.waitFor({ timeout: 10000 });
      await commentButtonLocator.scrollIntoViewIfNeeded({ timeout: 2000 });
      await sleep(2000);
      if (isHit(commentRate)) {
        await commentButtonLocator.waitFor({ timeout: 10000 });
        await commentButtonLocator.click({ timeout: 2000 });
        await sleep(2000);
        const randIdx = RandomNum(0, comments.length - 1);
        const commentText = comments[randIdx];
        logger(`随机文案 [${commentText}]`);
        let inputLocator = articleLocator.locator(
          "[role='presentation'] [role='textbox']",
        );
        let submitLocator = articleLocator.locator(
          "#focused-state-composer-submit [role='button'][tabindex='0']",
        );
        // 是否弹窗评论
        const dialogLocator = await getDialogLocator(page);
        if (dialogLocator) {
          logger(' - 弹窗评论 - ');
          inputLocator = dialogLocator.locator(
            "[role='presentation'] [role='textbox']",
          );
          submitLocator = dialogLocator.locator(
            "#focused-state-composer-submit [role='button'][tabindex='0']",
          );
        }
        await inputLocator.waitFor({ timeout: 10000 });
        await inputLocator.scrollIntoViewIfNeeded({ timeout: 2000 });
        await sleep(2000);
        await inputLocator.click({ timeout: 2000 });
        await sleep(2000);
        await inputLocator.type(commentText, { delay: 120, timeout: 0 });
        await sleep(5000);
        if (await nestIsVisible(submitLocator)) {
          await submitLocator.click({ timeout: 2000 });
        }

        await sleep(2000);
        stats.comment++;
      }
      return true;
    } catch (error) {
      logger(`- error - `, error);
      return false;
    }
  };

  const getArticleLocator = async (page, index) => {
    // const newArticleLocator = page
    //   .locator('[data-virtualized] .html-div .html-div')
    //   .filter({
    //     has: page.locator(
    //       "[data-visualcompletion] [aria-label][role='button'] span[dir='auto']",
    //     ),
    //   })
    //   .nth(index);
    const newArticleLocator = page
      .locator(`[aria-posinset='${index + 1}']`)
      .first();
    if (await nestIsVisible(newArticleLocator)) {
      return newArticleLocator;
    }
    return page.locator("[role='article']").nth(index);
  };

  const runTask = async (page) => {
    logger('- 首次滚动加载 -');
    // 滚动页面
    await sleep(3000);
    const sscript = scrollPageSs();
    await page.evaluate(sscript);

    for (let index = 0; index < total; index++) {
      const showIndex = index + 1;
      logger(`- deal ${showIndex} / ${total} - `);
      await sleep(8000);
      try {
        // 有弹窗都关闭
        await closeAllDialog(page);
        const articleLocator = await getArticleLocator(page, index);
        const isVisible = await nestIsVisible(articleLocator);
        if (!isVisible) {
          logger(`- ${showIndex} not visible, ignore -`);
          continue;
        }
        // 帖子是否已加载
        const loadingLocator = articleLocator
          .locator("[role='status']")
          .first();
        if (await nestIsVisible(loadingLocator)) {
          logger('- 等待加载 -');
          try {
            await loadingLocator.waitFor({
              timeout: 10 * 1000,
              state: 'hidden',
            });
            logger('- 等待加载 ok -');
          } catch (error) {}
        }
        await articleLocator.scrollIntoViewIfNeeded({ timeout: 5000 });
        await sleep(3000);
        const commentButtonLocator = articleLocator
          .locator(
            "[data-visualcompletion] [aria-label][role='button'] span[dir='auto']",
          )
          .nth(1);
        const hasCommentButton = await nestIsVisible(commentButtonLocator);
        if (!hasCommentButton) {
          logger('- 该帖子没有点赞评论按钮，忽略 -');
          continue;
        }

        const res = await likePost(page, index);
        // if (res === false) {
        //   logger(`重试 ${index + 1}`);
        //   // 重试一次
        //   const sscript = scrollPageSs();
        //   await page.evaluate(sscript);
        //   await sleep(2000);
        //   await likePost(page, index);
        // }
        await sleep(3000);

        const commentRes = await commentPost(page, index);
        // if (commentRes === false) {
        //   logger(`评论重试 ${index + 1}`);
        //   // 重试一次
        //   const sscript = scrollPageSs();
        //   await page.evaluate(sscript);
        //   await sleep(2000);
        //   await commentPost(page, index);
        // }
        await sleep(3000);
      } catch (error) {
        logger(`第 ${index + 1} 个post处理异常: `, error);
      }
    }
  };

  const context = browser.contexts()[0];
  // const page = await context.pages()[0];

  const page = await context.newPage();

  await page.goto(link, { timeout: 120 * 1000 });
  await page.waitForLoadState();
  await sleep(1000);
  await runTask(page);

  await screenshot(page);

  await sleep(1000);
  await page.close();
  await context.close();
  logger(`- 任务完成 -, 点赞 ${stats.like}, 评论 ${stats.comment}`);
} catch (error) {
  logger('- task error - ', error);
} finally {
  if (shutdown) {
    await NestCloseBrowser(id);
  }
}
