/**
 * Программа получает в качестве аргументов ipv4 адреса и фильтрует файл логов по этим адресам
 * записывая результат в отдельные файлы.
 **/

const fs = require('fs');

const searchedIp = process.argv.splice(2);

const readStream = fs.createReadStream('./access.test.log', 'utf-8');

console.log('Log file filtering started.');

readStream.on('data', (chunk) => {
  const regex = /^((?:\d{1,3}\.){3}\d{1,3}).*$/gm;

  while ((logLine = regex.exec(chunk)) !== null) {
    if (searchedIp.includes(logLine[1])) {
      fs.appendFile(
        `./${logLine[1]}_requests.log`,
        `${logLine[0]}\n`,
        (error) => {
          if (error) console.log(error);
        }
      );
    }
  }
});

readStream.on('end', () => console.log('Log file filtering completed.'));
