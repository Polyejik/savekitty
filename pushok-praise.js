(() => {
  const RU = [
    "🐾 Получилось. Хорошо идём.",
    "О, ещё один замок открыт. Спасибо тебе.",
    "Ты здорово разобрался. Давай следующий.",
    "Да, именно так. Я бы сам тут точно запутался.",
    "Ещё один. Кажется, у нас правда получится.",
    "Мне уже не так страшно, когда ты рядом.",
    "Ты хорошо считаешь. Я это уже заметил.",
    "Спасибо, что не бросаешь меня. Идём дальше?",
    "Вот видишь — получилось. Спокойно и точно.",
    "Мне нравится, как ты думаешь. Без суеты.",
    "Ещё один щелчок. Я уже чуть ближе к выходу.",
    "Ты всё сделал правильно. Можно выдохнуть.",
    "Хорошо посчитал. Я бы дал тебе пять лапой.",
    "Мяу. Это было уверенно.",
    "Смотри, замок открылся. Значит, всё верно.",
    "Мне кажется, ты уже вошёл во вкус.",
    "Отлично разобрался. Следующий будет не страшнее.",
    "Спасибо. С каждым замком мне спокойнее.",
    "Ты не просто угадал — ты правильно решил.",
    "Хорошая работа. Давай не спешить и так же дальше.",
    "Ещё один готов. Мне уже хочется улыбаться.",
    "Ты правда умеешь это делать.",
    "Вот так. Шаг за шагом — и клетка сдаётся.",
    "Мне повезло со спасателем.",
    "Всё сошлось. Красиво получилось.",
    "Ты молодец. Особенно потому, что не торопишься.",
    "Кажется, математика сегодня на нашей стороне.",
    "Я смотрю и думаю: ну всё, выберемся.",
    "Так держать. У тебя получается всё увереннее.",
    "Спасибо тебе. Я уже слышу свободу где-то рядом.",
    "Вот это мне нравится: подумал — и решил.",
    "Ещё один замок позади. Неплохо мы с тобой идём.",
    "Правильно. Можно смело двигаться дальше.",
    "Ты внимательный. Это очень помогает.",
    "О, да. Именно этот ответ.",
    "Хорошо получилось. Я даже перестал волноваться на секунду.",
    "Ты справился. И без лишней спешки.",
    "Мяу, я начинаю тобой гордиться.",
    "Ещё немного. Ты отлично держишь темп.",
    "С таким помощником у меня хорошие шансы.",
    "Вот и всё — этот замок больше не мешает.",
    "Ты понял самое главное. Дальше будет легче.",
    "Мне нравится твоя настойчивость.",
    "Очень хорошо. Давай ещё один вместе.",
    "Сделано. Спасибо, что так стараешься.",
    "Ты всё увереннее решаешь. Это видно.",
    "Ещё шаг. Я рядом и болею за тебя.",
    "Правильно! Я так надеялся, что получится.",
    "Хороший ответ. И главное — ты сам до него дошёл.",
    "Кажется, клетка уже понимает, с кем связалась.",
    "Ты меня здорово выручаешь.",
    "Спокойно, точно, правильно. Отлично.",
    "Ещё один открыт. У нас с тобой хорошая команда.",
    "Мне уже хочется выбраться и побегать.",
    "Ты справился и с этим. Я в тебе не сомневался.",
    "Давай дальше. У тебя сейчас очень хорошо идёт.",
    "Вот так и надо. По одному шагу.",
    "Спасибо. Я уже почти не боюсь.",
    "Ты отлично соображаешь. Правда.",
    "Мяу. Ещё один замок — и ещё одна маленькая победа."
  ];

  const EN = [
    "🐾 Got it. We’re doing well.",
    "Oh, another lock opened. Thank you.",
    "You worked that out really well. Ready for the next one?",
    "Yes, exactly. I’d definitely get tangled up in that one myself.",
    "Another one. I think we’re really going to make it.",
    "I’m not as scared when you’re here.",
    "You’re good at this. I’ve noticed.",
    "Thanks for not leaving me. Shall we keep going?",
    "See? You got it. Calm and careful.",
    "I like the way you think. No rushing.",
    "Another little click. I’m closer to getting out.",
    "You did that right. We can relax for a second.",
    "Nice work. I’d give you a high five... or a high paw.",
    "Meow. That was confident.",
    "Look, the lock opened. So you got it right.",
    "I think you’re getting the hang of this.",
    "Nicely worked out. The next one doesn’t have to be scary either.",
    "Thank you. Every open lock makes me feel calmer.",
    "You didn’t just guess — you solved it.",
    "Good work. Let’s keep taking our time.",
    "Another one done. I’m starting to smile.",
    "You really do know how to do this.",
    "That’s it. Step by step, the cage is giving in.",
    "I got lucky with my rescuer.",
    "Everything fits. Nice.",
    "You did well. I like that you didn’t rush.",
    "I think math is on our side today.",
    "I’m watching you and thinking: yep, we’re getting out of here.",
    "Keep going like that. You’re getting more confident.",
    "Thank you. Freedom feels a little closer now.",
    "That’s what I like: you thought it through and solved it.",
    "Another lock behind us. We make a pretty good team.",
    "Right. We can move on.",
    "You’re paying attention. That really helps.",
    "Oh yes. That’s the answer.",
    "Nice. I actually stopped worrying for a second.",
    "You got it — and you didn’t rush.",
    "Meow, I’m starting to feel proud of you.",
    "Just a bit more. You’re keeping a really good pace.",
    "With you helping me, I like my chances.",
    "There. That lock can’t bother us anymore.",
    "You understood the important part. The rest will come.",
    "I like that you keep trying.",
    "Very good. Let’s do one more together.",
    "Done. Thanks for trying so hard.",
    "You’re solving these more confidently now. I can tell.",
    "One more step. I’m right here cheering for you.",
    "Yes! I was really hoping that would work.",
    "Good answer. And you got there by yourself.",
    "I think the cage is starting to regret messing with us.",
    "You’re helping me a lot.",
    "Calm, careful, correct. Nice.",
    "Another one open. We make a good team.",
    "I already want to get out and run around.",
    "You got that one too. I knew you could.",
    "Let’s keep going. You’re on a good roll.",
    "That’s the way. One step at a time.",
    "Thank you. I’m almost not scared anymore.",
    "You’re really good at figuring things out.",
    "Meow. One more lock, one more little win."
  ];

  function shuffledIndices(n) {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  window.pushokPraise = function(lang) {
    const code = lang === "en" ? "en" : "ru";
    const pool = code === "en" ? EN : RU;
    const bagKey = "savekitty_pushok_praise_bag_v2_" + code;
    const lastKey = "savekitty_pushok_praise_last_v2_" + code;
    let bag = [];
    let last = -1;

    try {
      bag = JSON.parse(localStorage.getItem(bagKey) || "[]");
      last = Number(localStorage.getItem(lastKey) || -1);
    } catch (_) {}

    const valid = Array.isArray(bag) && bag.every(i => Number.isInteger(i) && i >= 0 && i < pool.length);
    if (!valid || bag.length === 0) {
      bag = shuffledIndices(pool.length);
      if (pool.length > 1 && bag[bag.length - 1] === last) {
        [bag[bag.length - 1], bag[bag.length - 2]] = [bag[bag.length - 2], bag[bag.length - 1]];
      }
    }

    const index = bag.pop();
    try {
      localStorage.setItem(bagKey, JSON.stringify(bag));
      localStorage.setItem(lastKey, String(index));
    } catch (_) {}
    return pool[index];
  };
})();
