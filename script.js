document.addEventListener('DOMContentLoaded', () => {  // Весь код запускается только когда DOM загружен
   
   // ===== прячем/запускаем шапку при скролле =====
   let lastScrollY = window.scrollY; //запоминаем предыдущую позицию скролла
   const header = document.querySelector('.header');

   window.addEventListener('scroll', () => {
      if (lastScrollY < window.scrollY && window.scrollY > 100) { //Если пользователь скроллит вниз / > 100 → чтобы сразу при загрузке страницы шапка не исчезала 
         header.classList.add('hidden');                          //→ шапка скрывается
      } else {
         header.classList.remove('hidden');                       //→ шапка появляется
      }
      lastScrollY = window.scrollY;
   });
  
// ==== Логика для светового пятна курсора ======
   const spotlight = document.getElementById('cursor-spotlight');
   if (spotlight) { // Проверяем, существует ли элемент
      window.addEventListener('mousemove', (e) => {   //→ отслеживает движение мышки
         // Обновляем позицию нашего "фонарика"
         spotlight.style.left = e.clientX + 'px';// e.clientX — горизонтальная координата курсора
         spotlight.style.top = e.clientY + 'px';// e.clientY — вертикальная координата курсора
      });
   }

  // ===== Анимация появления секций при скролле =====
  const sections = document.querySelectorAll('.content-section');
  const observer = new IntersectionObserver((entries) => {  //следит, когда элемент входит в область видимости
      entries.forEach(entry => {
         if (entry.isIntersecting) {
            entry.target.classList.add('is-visible'); //При появлении → добавляется класс is-visible 
         }
      });
   }, { rootMargin: '0px', threshold: 0.18 });  //→ сработает, если видно хотя бы 18% блока
   sections.forEach(section => observer.observe(section)); //Для каждого блока section начни наблюдать через observer

   // ===== Tabs / Highlighter logic =====
   //Находим все кнопки-вкладки (tabs), панели (panels) и подсветку (highlighter).Eсли вкладок нет → код не запускается
   const tabs = Array.from(document.querySelectorAll('#experience .tabs-list button'));
   const panels = Array.from(document.querySelectorAll('#experience .tabs-panels [role="tabpanel"]'));
   const highlighter = document.querySelector('#experience .tabs-list .highlighter');

   if (!highlighter || tabs.length === 0) return;  //→ если элемент-подсветка не найден в DOM (querySelector вернул null). tabs.length === 0 → если кнопок-вкладок нет.Е
   // если хоть одно из условий выполняется, то return; завершает выполнение функции, и код дальше не выполняется.

   const BUTTON_HEIGHT = Math.round(parseFloat(getComputedStyle(tabs[0]).height)) || 48;
   const MOVE_MS = 300; //скорость движения
   const TAIL_MS = 180; //скорость анимации «хвоста»
   const EASING  = 'cubic-bezier(.2,.9,.2,1)';  //плавность движения

   let tailTimer = null;  //Чтобы не запутаться в нескольких параллельных setTimeout

   function getTranslateY(el) {
      const style = window.getComputedStyle(el);
      const transform = style.transform || style.webkitTransform;
      if (!transform || transform === 'none') return 0;
      const m2 = transform.match(/matrix\(([-0-9.,\s]+)\)/);
      if (m2) return parseFloat(m2[1].split(',')[5]) || 0;
      const m3 = transform.match(/matrix3d\(([-0-9.,\s]+)\)/);
      if (m3) return parseFloat(m3[1].split(',')[13]) || 0;
      return 0;
   }

   function clearTailTimer() {
      if (tailTimer) { clearTimeout(tailTimer);  //В начале движения очищает старый таймер
         tailTimer = null; }  //
   }

   //Инициализация
   function initHighlighter() {
      const activeIndex = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');  //Находим активную вкладку
      const idx = activeIndex >= 0 ? activeIndex : 0;  //Если нет активной → ставим подсветку на первую
      highlighter.style.transition = 'none'; //временно убираем анимацию, чтобы при загрузке страницы подсветка сразу оказалась на месте, а не «приехала» с эффектом
      highlighter.style.transform = `translateY(${idx * BUTTON_HEIGHT}px)`;
      highlighter.style.height = `${BUTTON_HEIGHT}px`;
      void highlighter.offsetWidth;  // для сброса анимации (чтобы при инициализации не было мигания, иначе при первом клике могла бы сработать старая анимация)
   }
   initHighlighter();

   //Анимация движения подсветки
   function moveHighlighter(targetIndex) {
      clearTailTimer();

      const currentY = getTranslateY(highlighter);
      const targetY = targetIndex * BUTTON_HEIGHT;
      const delta = targetY - currentY;

      if (Math.round(currentY) === Math.round(targetY)) return; 

      void highlighter.offsetWidth;  //хак» для сброса анимации (чтобы при инициализации не было мигания

      if (delta > 0) {
         // ===== ДВИЖЕНИЕ ВНИЗ =====
         // → растягивает рамку, потом схлопывает
         highlighter.style.transition = 'none';
         highlighter.style.height = `${BUTTON_HEIGHT + Math.round(delta)}px`;
         highlighter.style.transform = `translateY(${currentY}px)`;
         void highlighter.offsetWidth;
         highlighter.style.transition = `transform ${MOVE_MS}ms ${EASING}, height ${MOVE_MS}ms ${EASING}`;
         highlighter.style.transform = `translateY(${targetY}px)`;
         highlighter.style.height = `${BUTTON_HEIGHT}px`;
         tailTimer = setTimeout(() => {  //задаёт новый таймер
            highlighter.style.transition = `height ${TAIL_MS}ms ease-out`;
            highlighter.style.height = `${BUTTON_HEIGHT}px`;
            tailTimer = null;
         }, MOVE_MS + 8);
      } else {
         // ===== ДВИЖЕНИЕ ВВЕРХ =====
         //→ сначала удлиняет с «хвостом», потом уменьшает
         const absDelta = Math.abs(Math.round(delta));
         const extra = Math.round(BUTTON_HEIGHT * 0.25); // +25% высоты для хвоста

         // Увеличиваем рамку немного вниз, хвост слегка длиннее
         highlighter.style.transition = 'none';
         highlighter.style.height = `${BUTTON_HEIGHT + extra}px`;
         highlighter.style.transform = `translateY(${currentY}px)`;
         void highlighter.offsetWidth;

         // Двигаем рамку вверх, хвост всё время сохраняет extra-приращение
         highlighter.style.transition = `transform ${MOVE_MS}ms ${EASING}`;
         highlighter.style.transform = `translateY(${targetY}px)`;

         // После достижения позиции убираем extra
         tailTimer = setTimeout(() => {
            highlighter.style.transition = `height ${TAIL_MS}ms ease-out`;
            highlighter.style.height = `${BUTTON_HEIGHT}px`;
            tailTimer = null;
         }, MOVE_MS + 8);
      }
   }
  
   // ======= Ползунок нарядом с выбранной кнопкой в Berufserfahrung
   tabs.forEach((tab, idx) => {
      tab.addEventListener('click', () => {  //Реакция на клик
         // Все вкладки делаем неактивными
         tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
         // Активной делаем ту, по которой кликнули
         tab.setAttribute('aria-selected', 'true');
         // Прячем все панели
         panels.forEach(p => p.classList.add('hidden'));
         // Показываем только связанную с вкладкой
         const panel = document.getElementById(tab.getAttribute('aria-controls'));
         //Только нужная панель → показана
         if (panel) panel.classList.remove('hidden');  
         moveHighlighter(idx);  //двигаем под выбранный таб
      });
   });

   //========Контакты (Telefon / E-Mail / Adresse)
   const contactButtons = Array.from(document.querySelectorAll('#contact-menu button'));
   const contactContents = Array.from(document.querySelectorAll('#contact-details .contact-content'));

   contactButtons.forEach(button => {
      button.addEventListener('click', () => {
         contactButtons.forEach(btn => btn.classList.remove('active'));
         contactContents.forEach(content => content.classList.remove('active'));
         const targetId = button.getAttribute('data-target');
         const targetContent = document.getElementById(targetId);  //→ это ID блока с данными
         button.classList.add('active');
         if (targetContent) targetContent.classList.add('active');
      });
   });

   // ===== Логика для показа сертификатов по клику =====
   const courseCards = document.querySelectorAll('.course-card');
   const overlay = document.getElementById('certificate-overlay');
   const overlayImage = document.getElementById('certificate-image');

   courseCards.forEach(card => {  
      const preview = card.querySelector('.certificate-preview img'); // сразу ищем img
      if (!preview) return;  

      // Показываем сертификат по клику на карточку
      card.addEventListener('click', (event) => {
         overlayImage.src = preview.src; // берем src из картинки внутри карточки
         overlay.classList.add('visible');  //Показывается модальное окно
      });
   });

   // Закрытие при клике на сам оверлей
   overlay.addEventListener('click', () => {
      overlay.classList.remove('visible');
      overlayImage.src = ""; // очистим, чтобы не грузить память
   });

   // Логика для стрелок вверх
   const arrows = document.querySelectorAll('.arrow');

   // Функция для показа/скрытия стрелок
   function toggleArrows() {
      arrows.forEach(arrow => {
         if (window.pageYOffset > 400) {
            arrow.classList.add('show');
         } else {
            arrow.classList.remove('show');
         }
      });
   }

   // Функция для прокрутки вверх
   function scrollToTop() {
      window.scrollTo({
         top: 0,
         behavior: 'smooth'
      });
   }

   // Добавление обработчиков для стрелок
   arrows.forEach(arrow => {
      // Клик для прокрутки вверх
      arrow.addEventListener('click', scrollToTop);

      // Эффект при наведении мыши
      arrow.addEventListener('mouseenter', () => {
         arrow.style.transform = 'scale(1.1)';
      });

      arrow.addEventListener('mouseleave', () => {
         arrow.style.transform = 'scale(1)';
      });
   });

   // Добавление обработчика прокрутки окна
   window.addEventListener('scroll', toggleArrows);

   //===========Footer===========
   const footer = document.querySelector("footer");

   const footerObserver = new IntersectionObserver(entries => {
   entries.forEach(entry => {
      if (entry.isIntersecting) {
         footer.classList.add("visible");// появляется
      } else {
         footer.classList.remove("visible"); // исчезает
      }
      });
   }, { threshold: 0.3 }); // срабатывает, когда футер хотя бы на 30% виден
   footerObserver.observe(footer);

   window.addEventListener('beforeunload', () => { clearTailTimer(); }); });

