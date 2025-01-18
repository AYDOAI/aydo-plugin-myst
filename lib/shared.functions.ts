'use strict';
//
// export function fixTimeZone(timestamp, timezone) {
//   const date = new Date(timestamp * 1000);
//   date.setMinutes(date.getMinutes() - timezone);
//   return Math.floor(date.getTime() / 1000);
// }
//
// export function getDisplayInfo(app, device, ident, model = null, title = null, measure = null, type = null) {
//   if (!device.functions) {
//     device.functions = [];
//   }
//   let func = device.functions.find(func => func.view === 'info');
//   if (!func) {
//     func = {
//       type: 'info',
//       view: 'info',
//       models: [],
//       modelsDiff: [],
//       values: [],
//       valuesDiff: [],
//       titles: [],
//       measures: [],
//       types: [],
//     };
//     device.functions.unshift(func);
//   }
//   func.models.push(`device.:ident.status.${model ? model : ident}`);
//   func.modelsDiff.push(`device.:ident.status.${model ? model : ident}_diff`);
//   func.values.push(null);
//   func.valuesDiff.push(null);
//   func.titles.push(title ? title : `measure_types.${ident}`);
//   func.measures.push(measure ? measure : `measures.${ident}`);
//   if (!func.types) {
//     func.types = [];
//     for (let i = 0; i < func.models.length - 1; i++) {
//       func.types.push(null);
//     }
//   }
//   func.types.push(type ? type : ident);
// }
//
// export function getDisplayButtons(app, device, buttons, ident, model = null, command = null, title = null, value = null) {
//   device.functions.push({
//     title: title ? title : `main.${ident}`,
//     type: ident,
//     view: 'buttons',
//     model: `device.:ident.status.${model ? model : ident}`,
//     value: null,
//     buttons,
//     data: {
//       ident: ':ident',
//       command: command ? command : ident,
//       value: value ? value : `:${ident}`
//     }
//   });
// }
//
// export function getDisplayButton(app, device, title, block, icon, command) {
//   device.functions.push({
//     view: 'button',
//     title,
//     block,
//     icon,
//     command,
//     data: {
//       ident: device.ident,
//       command: ':command'
//     },
//   });
// }
//
// export function getDisplaySliderButtons(app, device, ident, model = null, command = null, valueMin = 0, valueMax = 100, measure = null) {
//   device.functions.push({
//     title: `main.${ident}`,
//     type: ident,
//     view: 'slider_buttons',
//     model: `device.:ident.status.${model ? model : ident}`,
//     // modelMax: 'device.:ident.status.masterVolumeMax',
//     value: null,
//     valueMin,
//     valueMax,
//     measure,
//     data: {
//       ident: ':ident',
//       command: command ? command : ident,
//       value: `:${ident}`
//     },
//   });
// }
//
// export function getDisplaySlider(app, device, ident, model = null, command = null, valueMin = 0, valueMax = 100,
//                                  measure = null, prependIcon = null, appendIcon = null, legend = false, title = null,
//                                  valueStep = null, valueStep2 = null) {
//   device.functions.push({
//     title: title ? title : `main.${ident}`,
//     type: ident,
//     view: 'slider',
//     model: `device.:ident.status.${model ? model : ident}`,
//     // modelMax: 'device.:ident.status.masterVolumeMax',
//     value: null,
//     valueMin,
//     valueMax,
//     valueStep,
//     valueStep2,
//     measure: measure ? measure : `measures.${ident}`,
//     prependIcon,
//     appendIcon,
//     legend,
//     data: {
//       ident: ':ident',
//       command: command ? command : ident,
//       value: `:${ident}`
//     },
//   });
// }
//
// export function getDisplayRgb(app, device, ident, model = null, command = null) {
//   device.functions.push({
//     title: `main.${ident}`,
//     type: ident,
//     view: 'rgb',
//     model: `device.:ident.status.${model ? model : ident}`,
//     value: null,
//     data: {
//       ident: ':ident',
//       command: command ? command : ident,
//       value: `:${ident}`
//     },
//   });
// }
//
// export function getDisplaySwitcher(app, device, ident, model = null, command = null, titleOn = 'on', titleOff = 'off', title = null, type = null) {
//   device.functions.push({
//     title: title ? title : `main.${ident}`,
//     type: ident,
//     view: 'switcher',
//     model: `device.:ident.status.${model ? model : ident}`,
//     value: null,
//     buttons: [
//       {
//         title: titleOff,
//         value: false
//       },
//       {
//         title: titleOn,
//         value: true
//       },
//     ],
//     data: {
//       ident: ':ident',
//       command: command ? command : ident,
//       value: `:${ident}`
//     }
//   });
// }
//
// export function getDisplayTouchPanel(app, device, command, timer = 500) {
//   device.functions.push({
//     view: 'touch_panel',
//     timer,
//     command,
//     data: {
//       ident: device.ident,
//       command: ':command'
//     },
//   });
// }
//
export function getDisplaySelect(app, device, buttons, ident, model = null, command = null, title = null) {
  device.functions.push({
    title: title ? title : `main.${ident}`,
    type: ident,
    view: 'select',
    model: `device.:ident.status.${model ? model : ident}`,
    value: null,
    buttons,
    data: {
      ident: ':ident',
      command: command ? command : ident,
      value: `:${ident}`
    }
  });
}

// export function getDisplayButtonsPanel(app, device, container) {
//   device.functions.push({
//     view: 'buttons_panel',
//     container,
//     data: {
//       ident: device.ident,
//       command: ':command'
//     },
//   });
// }
//
// export function getDisplayColorTemperature(app, device, ident, model = null, command = null, valueMin = 1000, valueMax = 10000) {
//   device.functions.push({
//     title: `main.${ident}`,
//     type: ident,
//     view: 'ct',
//     model: `device.:ident.status.${model ? model : ident}`,
//     value: null,
//     valueMin,
//     valueMax,
//     data: {
//       ident: ':ident',
//       command: command ? command : ident,
//       value: `:${ident}`
//     },
//   });
// }
//
// export function getOffsetPosition(evt, parent) {
//   const position = {
//     x: (evt.targetTouches) ? evt.targetTouches[0].pageX : evt.clientX,
//     y: (evt.targetTouches) ? evt.targetTouches[0].pageY : evt.clientY
//   };
//
//   while (parent.offsetParent) {
//     position.x -= parent.offsetLeft - parent.scrollLeft;
//     position.y -= parent.offsetTop - parent.scrollTop;
//
//     parent = parent.offsetParent;
//   }
//   position.x = Math.floor(position.x);
//   position.y = Math.floor(position.y);
//   return position;
// }
//
// export function getRegexValue(regex, str, index) {
//   let result = null;
//   let m;
//   while ((m = regex.exec(str)) !== null) {
//     // This is necessary to avoid infinite loops with zero-width matches
//     if (m.index === regex.lastIndex) {
//       regex.lastIndex++;
//     }
//
//     // The result can be accessed through the `m`-variable.
//     m.forEach((match, groupIndex) => {
//       if (groupIndex === index) {
//         result = match;
//       }
//     });
//   }
//   return result;
// }
//
// export function getRegexTable(regex, str) {
//   const result = {};
//   let lastMatch;
//   let m;
//   while ((m = regex.exec(str)) !== null) {
//     if (m.index === regex.lastIndex) {
//       regex.lastIndex++;
//     }
//     m.forEach((match, groupIndex) => {
//       switch (groupIndex) {
//         case 1:
//           lastMatch = match;
//           break;
//         case 2:
//           result[lastMatch] = parseFloat(match.replace(',', '.'));
//       }
//     });
//   }
//   return result;
// }
//
// export function getBalanceFromInvoice(data, paymentTitles, inquiryTitles) {
//   let result = 0;
//   Object.keys(data).forEach(key => {
//     const keyValue = data[key];
//     key = key.toLowerCase();
//     if (keyValue) {
//       paymentTitles.forEach(title => {
//         if (key.indexOf(title) !== -1) {
//           result += keyValue;
//         }
//       });
//       inquiryTitles.forEach(title => {
//         if (key.indexOf(title) !== -1) {
//           result -= keyValue;
//         }
//       });
//     }
//   });
//   return result;
// }
//
// export function randomMac() {
//   return 'XX:XX:XX:XX:XX:XX'.replace(/X/g, function () {
//     return '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16))
//   });
// }
//
// export function randomPin() {
//   return 'XXX-XX-XXX'.replace(/X/g, function () {
//     return '0123456789'.charAt(Math.floor(Math.random() * 10))
//   });
// }
//
// export function checkTimeoutEx(item, ident, method, timeout = 1000, force = false) {
//   if (force || !item[ident] || new Date().getTime() - item[ident] >= timeout) {
//     clearTimeout(item[`${ident}_timeout`]);
//     item[ident] = new Date().getTime();
//     method();
//   } else {
//     clearTimeout(item[`${ident}_timeout`]);
//     item[`${ident}_timeout`] = setTimeout(() => {
//       item[ident] = new Date().getTime();
//       method();
//     }, timeout - (new Date().getTime() - item[ident]));
//   }
// }
//
// export function parseJson(result, params, ident = '') {
//   Object.keys(params).forEach(key => {
//     const newKey = `${ident}${ident ? '/' : ''}${key}`;
//     if (params[key] && typeof params[key] === 'object') {
//       parseJson(result, params[key], newKey);
//     } else {
//       result[newKey] = params[key];
//     }
//   });
// }
//
export function combineObjects(target, source, check = false, error = false) {
  if (source && Array.isArray(source)) {
    source.forEach(item => {
      if (typeof item === 'object') {
        const item1 = {};
        combineObjects(item1, item);
        target.push(item1);
      } else {
        target.push(item);
      }
    });
  } else if (source) {
    Object.keys(source).forEach(key => {
      if (error && ['body'].indexOf(key) === -1) {
        // console.log('combineObjects', key, source[key]);
      } else if (source[key] === null) {
        target[key] = null;
      } else if (typeof source[key] === 'object') {
        if (!target[key]) {
          if (Array.isArray(source[key])) {
            target[key] = [];
          } else {
            target[key] = {};
          }
        }
        combineObjects(target[key], source[key], false, key === 'error')
      } else {
        if (!check || target[key] === undefined) {
          target[key] = source[key];
        }
      }
    });
  }
}

// export function getPossibleValue(value, possibleValues, defaultValue) {
//   if (possibleValues.indexOf(value) !== -1) {
//     return value;
//   } else {
//     return defaultValue;
//   }
// }
//
// export function range(min, max) {
//   const arr = [];
//   for (let i = min; i <= max; i++) {
//     arr.push(i);
//   }
//   return arr;
// }
//
// export function stringToHex(str) {
//   let result = '';
//   for (let i = 0; i < str.length; i++) {
//     result += ('0' + str.charCodeAt(i).toString(16)).slice(-2);
//   }
//   return result;
// }
//
// export function arrayToStr(arr) {
//   let str = '';
//   for (let i = 0; i < arr.length; i++) {
//     if (arr[i]) {
//       str += String.fromCharCode(arr[i]);
//     }
//   }
//   return str;
// }
//
// export function logTable(stats) {
//   let result = '';
//   const format = (text, count, left = false) => {
//     const spaces = () => {
//       return new Array(count - text.length).join(' ');
//     };
//     return `${left ? spaces() : ''}${text}${left ? '' : spaces()}`;
//   };
//   stats.forEach(stat => {
//     let row = '';
//     Object.keys(stat).forEach(key => {
//       let max = 0;
//       stats.forEach(stat1 => {
//         max = Math.max(max, `${stat1[key]}`.length);
//       });
//       row += `${row ? ' ' : ''}${key}${key ? ': ' : ''}${format(`${stat[key]}`, max + 1, !!key)}${row ? ';' : ''}`;
//     });
//     result += '\n' + row;
//   });
//   return result;
// }
//
// export function removeLast(data, chr = '\n') {
//   let result = data;
//   if (data && data[data.length - 1] === chr) {
//     result = data.substring(0, data.length - 1);
//   }
//   return result
// }
//
// export function localize(data, localization) {
//   const check = (item) => {
//     if (item.title && typeof item.title === 'object') {
//       item.title = item.title[localization];
//     }
//     if (item.measure && typeof item.measure === 'object') {
//       item.measure = item.measure[localization];
//     }
//   }
//   Object.keys(data).forEach(key => {
//     const item = data[key];
//     if (item && Array.isArray(item)) {
//       item.forEach(subItem => {
//         check(subItem);
//         localize(subItem, localization);
//       });
//     } else if (item && typeof item === 'object') {
//       check(item);
//       localize(item, localization);
//     }
//   });
// }
//
// export function randomToken(len = 64) {
//   const forge = require('node-forge');
//   return stringToHex(forge.random.getBytesSync(len));
// }
//
// /** A more powerful version of the built-in JSON.stringify() function that uses the same function to respect the
//  * built-in rules while also limiting depth and supporting cyclical references.
//  */
// export function stringify(val: any, depth: number, replacer: (this: any, key: string, value: any) => any, space?: string | number, onGetObjID?: (val: object) => string): string {
//   depth = isNaN(+depth) ? 1 : depth;
//   var recursMap = new WeakMap();
//
//   function _build(val: any, depth: number, o?: any, a?: boolean, r?: boolean) {
//     return !val || typeof val != 'object' ? val
//       : (r = recursMap.has(val),
//         recursMap.set(val, true),
//         a = Array.isArray(val),
//         r ? (o = onGetObjID && onGetObjID(val) || null) : JSON.stringify(val, function (k, v) {
//           if (a || depth > 0) {
//             if (replacer) v = replacer(k, v);
//             if (!k) return (a = Array.isArray(v), val = v);
//             !o && (o = a ? [] : {});
//             o[k] = _build(v, a ? depth : depth - 1);
//           }
//         }),
//         o === void 0 ? (a ? [] : {}) : o);
//   }
//
//   return JSON.stringify(_build(val, depth), null, space);
// }
//
// export function getDeviceIdent(ident) {
//   return ident.split('.').join('_');
// }