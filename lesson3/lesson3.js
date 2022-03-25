/**
 * Программа получает в качестве аргументов ipv4 адреса и фильтрует файл логов по этим адресам
 * записывая результат в отдельные файлы.
 **/

const fs = require('fs');

/**
 * Функция удаляет пустые строки.
 * @param {String} string редактируемая строка.
 * @returns новая строка.
 */
function deleteEmptyLines(string) {
  return string.replace(/^\n/gm, '');
}

/**
 * Функция возвращает объект со списком строк лога и частью последней строки (если она не полная).
 * @param {String} chunk часть файла с логами.
 * @param {String} fistLinePart часть первой строки.
 * @returns объект { lines, lastLinePart }.
 */
function getLines(chunk, fistLinePart) {
  const fullLog =
    /^(?:\d{1,3}\.){3}\d{1,3} - - \[.*\] ".*" \d* \d* ".*" ".*"\n?$/;
  const lines = deleteEmptyLines(chunk).match(/.*?\n|.+$/g);
  const lastLine = lines[lines.length - 1];

  if (fistLinePart) {
    lines[0] = fistLinePart + lines[0];
  }

  if (fullLog.test(lastLine)) {
    if (!lastLine.endsWith('\n')) {
      lines[lines.length - 1] = lastLine + '\n';
    }
    return {
      lines,
      lastLinePart: '',
    };
  }

  lines.pop();

  return {
    lines,
    lastLinePart: lastLine,
  };
}

/**
 * Функция находит ip адрес в строке и возвращает этот фрагмент.
 * @param {String} string строка.
 * @returns фрагмент строки с ip адресом.
 */
function getIpv4(string) {
  return /(?:\d{1,3}\.){3}\d{1,3}/.exec(string)[0];
}

const buffer = {
  value: '',
};
const searchedIp = process.argv.splice(2);

const readStream = fs.createReadStream('./access.log', {
  encoding: 'utf-8',
});

const writeStreams = searchedIp.reduce(
  (streams, ip) => ({
    ...streams,
    [ip]: fs.createWriteStream(`./${ip}_requests.log`, {
      flags: 'a',
      encoding: 'utf8',
    }),
  }),
  {}
);

console.log('Log file filtering started.');

readStream.on('data', (chunk) => {
  const { lines, lastLinePart } = getLines(chunk, buffer.value);

  buffer.value = lastLinePart;

  lines.forEach((line) => {
    const ip = getIpv4(line);
    if (searchedIp.includes(ip)) writeStreams[ip].write(line);
  });
});

readStream.on('end', () => console.log('Log file filtering completed.'));
