const _ = require('lodash');
const expect = require("chai").expect;
const moment = require("moment");
const debug = require("debug")("tests:parser:longlabel");

const longlabel = require('../../parsers/longlabel');

const labelList = [
  "فيروس كورونا.. الأعراض والأسباب مع دكتور أيمن إمام ونائبه شيم حمزة | هي وبس by برنامج هي وبس 1 month ago 20 minutes 686,947 views",
  "REPLICA - Coronavirus, il bollettino della Protezione Civile: 3491 i nuovi contagi, 683 le vittime di La Repubblica 1 ora fa 1.785 visualizzazioni",
  "Dr. Fernando Maluf: O pico da epidemia deverá ocorrer em 3 a 6 semanas. by Marco Antonio Villa 5 days ago 24 minutes 101,795 views",
  "🈲遼寧爆甲肝疫情，可控！石正麗「否定」美國製造病毒；新冠病毒非人造證據找到？華南市場住4人吃什麼？揭世衛譚德塞老底；日本防疫國家發錢；曝中共網軍反美教科書；武漢北京等地疫情真相 |新聞拍案驚奇 大宇 by 新聞拍案驚奇 大宇 2 weeks ago 27 minutes 629,019 views",
  "ازاى تفرق بين أعراض ڤيروس كورونا وبين الانفلونزا ،، ومفاجأة أول علاج حصري لڤيروس كورونا by Marian Maher 4 days ago 4 minutes, 40 seconds 389,052 views",
  "【驚】武漢肺炎 醫生爆「遺體多到用貨車拖」；湖南爆發禽流感；中共數據藏神秘規律？內蒙古驚傳「無接觸」感染｜世界的十字路口 唐浩 世界的十字路口 唐浩 1 mês atrás 17 minutos 750.285 visualizações",
  "Is Spain Europe's new coronavirus epicentre? de Sky News il y a 22 heures 2 minutes et 56 secondes 120 146 vues",
  "Edizione delle ore 13.30 del 23/03/2020 di TG La7 2 giorni fa 40 minuti 115.273 visualizzazioni",
  "The Impact of Coronavirus on China's Economy, Politics, and the U.S.-China Relationship di Asia Society 5 giorni fa 1 ora 40.326 visualizzazioni",
  "Quando a Ideia é Boa Fica Fácil Ganhar Dinheiro #To earn money OFICINA CAIPIRA do Pereira 1 mês atrás 14 minutos e 49 segundos 1.954.970 visualizações",
  "تعرف على أعراض فيروس كورونا.. ولمعرفة المزيد www.care.gov.eg by eXtra news 2 weeks ago 44 seconds 233,573 views",
  "Lesson from South Korea on how to slow the COVID-19 spread | ABC News by ABC News 19 hours ago 3 minutes, 43 seconds 286,630 views",
  "في زمن الكورونا..تدخل وكيل الملك واعتقال مولات الدار لي جرات على السيدة لي كاريا ليها فخريبكة by Chouftv - شوف تيفي 12 hours ago 15 minutes 619,509 views",
  "How to open a padlock easy | LabsJack by LabsJack 3 years ago 5 minutes, 40 seconds 78,395,304 views",
  "Remédios apresentam bons resultados na cura do coronavírus | AQUI NA BAND by Aqui na Band 5 days ago 4 minutes, 49 seconds 1,342,220 views",
  "YouTube's Copyright System Isn't Broken. The World's Is. di Tom Scott 1 giorno fa 42 minuti 889.895 visualizzazioni",
  "#ConferenciaDePrensa: #Coronavirus #COVID19 | 19 de marzo de 2020 by Gobierno de México Streamed 5 days ago 57 minutes 493,671 views",
  "Coronavirus en el Mundo l Cuarentena beneficia al medio ambiente - Las Noticias con Claudio di Noticieros Televisa 6 giorni fa 71 secondi 63.202 visualizzazioni",
  "欧洲英国新冠肺炎疫情严重 留学生返港人数大增 de 美国之音中文网 Hace 1 semana 97 segundos 11,175 vistas",
  "Coronavírus: 10 boas notícias em meio à \"epidemia de medo\" di BBC News Brasil 2 settimane fa 6 minuti e 26 secondi 2.903.999 visualizzazioni",
  "Coronavírus: a briga entre Bolsonaro e João Doria Jornal O Globo 5 horas atrás 9 minutos e 20 segundos 20.570 visualizações",
  "傳染病有可能被消滅嗎? 人類第一個戰勝的傳染病-天花 de cheap Hace 1 mes 10 minutos y 49 segundos 371,104 vistas",
  "When The Assist Is More Beautiful Than The Goal by SportsHD 5 months ago 7 minutes, 42 seconds 25,896,926 views",
  "L'illusione del cibo naturale. Dario Bressanini di Dario Bressanini 4 anni fa 1 ora 141.091 visualizzazioni",
  "لماذا تفشى وباء كورونا (كوفيد-19) في إيطاليا؟ by AJ+ عربي 1 day ago 4 minutes, 43 seconds 1,120,785 views",
  "Why fighting the coronavirus depends on you di Vox 1 settimana fa 6 minuti e 30 secondi 6.036.139 visualizzazioni",
  "كورونا أم مجرد زكام ؟◄ كيف أميز بين أعراض كورونا و بين أعراض الانفلونزا أو الزكام ؟ de Al Majhool قناة المجهول il y a 1 mois 4 minutes et 26 secondes 326 517 vues",
  "هذا ما سيحصل مع المرضى.. طبيب مصاب بكورونا يوثق تطور حالته by CNNArabic 1 week ago 7 minutes, 11 seconds 2,511,338 views",
  "Te Explico POR QUÉ estoy PREOCUPADO | [COVID-19] door El Traductor de Ingeniería 5 dagen geleden 25 minuten 1.592.503 weergaven",
  "Four ways to protect yourself from coronavirus - BBC News di BBC News 1 settimana fa 3 minuti e 25 secondi 127.475 visualizzazioni",
  "Recorde de mortos na Itália por coronavírus | AFP by afpbr 1 week ago 61 seconds 1,099,179 views",
  "Trump: coronavirus es un virus chino I China acusa a EU de infiltrarles el coronavirus - En Punto de Noticieros Televisa Hace 1 semana 4 minutos y 34 segundos 1.466.539 visualizaciones",
  "Nardwuar vs. Tommy Chong (2020) de NardwuarServiette Hace 15 horas 20 minutos 33,078 vistas",
  "هل آلام البطن من أعراض الإصابة بكورونا؟ by AlArabiya العربية 4 days ago 30 seconds 21,241 views",
  "NY Gov. Cuomo Gives Update On Coronavirus Pandemic | NBC News (Live Stream Recording) di NBC News 59 minuti fa 8.351 visualizzazioni",
  "深思肺炎對經濟的打擊 剖析全球救援措施 Part 1〈蕭若元：理論蕭析〉2020-03-25（patreon5點已出） di memehongkong 1 giorno fa 15 minuti 110.177 visualizzazioni",
  "Efecto Pirry | ¿Tiene algo que ver el pangolín con el coronavirus Covid-19?, por red+ by Canal REDMÁS 1 month ago 24 minutes 722,938 views",
  "هذا ما سيحصل مع المرضى.. طبيب مصاب بكورونا يوثق تطور حالته av CNNArabic For 1 uke siden 7 minutter og 11 sekunder Sett 2 480 886 ganger",
  "艾未未：新型冠狀病毒是「中國製造」裡最響亮的牌子－ BBC News 中文 | HARDtalk by BBC News 中文 1 month ago 23 minutes 283,130 views",
  "《病毒进入人体48小时》新冠状病毒游记和预防 by Ronchen 1 month ago 3 minutes, 4 seconds 385 views",
  "Ventilator shortage could be solved by Sky News 5 hours ago 2 minutes, 43 seconds 81,080 views",
  "اكتشاف عنصر يمنع فيروس كورونا من الانتشار de: AlArabiya العربية Fa 5 anys 70 segons 1.661.125 visualitzacions",
  "Noticias EN VIVO de MILENIO Hace 2 días 818,419 vistas",
  "¡El Coronavirus en 5 minutos! - Wuhan/China Virus (Animación) di Juan Cano MD 1 mese fa 5 minuti e 8 secondi 965.513 visualizzazioni",
  "O que acontece com seu corpo quando você pega coronavírus? av Mistérios do Mundo For 1 dag siden 9 minutter og 5 sekunder Sett 938 640 ganger",
  "Coronavírus: por que há baixa incidência em crianças? by BBC News Brasil 1 month ago 4 minutes, 11 seconds 132,217 views",
  "احم نفسك من أول ساعة اصابة بكورونا معلومات جديدة وخطيرة by المبدعون العرب 5 days ago 20 minutes 818,659 views",
  "How wildlife trade is linked to coronavirus di Vox 2 settimane fa 8 minuti e 49 secondi 19.615.058 visualizzazioni",
  "世卫组织：有关冠状病毒的问答 by World Health Organization (WHO) 2 months ago 82 seconds 75,332 views",
  "Porque é que o coronavírus - Covid-19 - apareceu na China? de Qi News Hace 3 días 7 minutos y 7 segundos 424.003 visualizaciones"
];

function testllp(l) {
  it(l, function() {
    const mined = longlabel.parser(l);
    console.log(mined)
  });
}

/* This first check the capacity of load data from label */
describe("Testing a bunch of aria-label (longlabel.parser)", function() {

  _.each(labelList, function(label) {
    const testFunction = _.partial(testllp, label);
    testFunction();
  })

});