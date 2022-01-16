/*! For license information please see index.js.LICENSE.txt */
(() => {
  var t = {
      165: (t) => {
        var e = 1e3,
          n = 60 * e,
          r = 60 * n,
          i = 24 * r;
        function o(t, e, n, r) {
          var i = e >= 1.5 * n;
          return Math.round(t / n) + ' ' + r + (i ? 's' : '');
        }
        t.exports = function (t, s) {
          s = s || {};
          var a,
            c,
            u = typeof t;
          if ('string' === u && t.length > 0)
            return (function (t) {
              if (!((t = String(t)).length > 100)) {
                var o =
                  /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
                    t
                  );
                if (o) {
                  var s = parseFloat(o[1]);
                  switch ((o[2] || 'ms').toLowerCase()) {
                    case 'years':
                    case 'year':
                    case 'yrs':
                    case 'yr':
                    case 'y':
                      return 315576e5 * s;
                    case 'weeks':
                    case 'week':
                    case 'w':
                      return 6048e5 * s;
                    case 'days':
                    case 'day':
                    case 'd':
                      return s * i;
                    case 'hours':
                    case 'hour':
                    case 'hrs':
                    case 'hr':
                    case 'h':
                      return s * r;
                    case 'minutes':
                    case 'minute':
                    case 'mins':
                    case 'min':
                    case 'm':
                      return s * n;
                    case 'seconds':
                    case 'second':
                    case 'secs':
                    case 'sec':
                    case 's':
                      return s * e;
                    case 'milliseconds':
                    case 'millisecond':
                    case 'msecs':
                    case 'msec':
                    case 'ms':
                      return s;
                    default:
                      return;
                  }
                }
              }
            })(t);
          if ('number' === u && isFinite(t))
            return s.long
              ? ((a = t),
                (c = Math.abs(a)) >= i
                  ? o(a, c, i, 'day')
                  : c >= r
                  ? o(a, c, r, 'hour')
                  : c >= n
                  ? o(a, c, n, 'minute')
                  : c >= e
                  ? o(a, c, e, 'second')
                  : a + ' ms')
              : (function (t) {
                  var o = Math.abs(t);
                  return o >= i
                    ? Math.round(t / i) + 'd'
                    : o >= r
                    ? Math.round(t / r) + 'h'
                    : o >= n
                    ? Math.round(t / n) + 'm'
                    : o >= e
                    ? Math.round(t / e) + 's'
                    : t + 'ms';
                })(t);
          throw new Error(
            'val is not a non-empty string or a valid number. val=' +
              JSON.stringify(t)
          );
        };
      },
      977: (t, e, n) => {
        (e.formatArgs = function (e) {
          if (
            ((e[0] =
              (this.useColors ? '%c' : '') +
              this.namespace +
              (this.useColors ? ' %c' : ' ') +
              e[0] +
              (this.useColors ? '%c ' : ' ') +
              '+' +
              t.exports.humanize(this.diff)),
            !this.useColors)
          )
            return;
          const n = 'color: ' + this.color;
          e.splice(1, 0, n, 'color: inherit');
          let r = 0,
            i = 0;
          e[0].replace(/%[a-zA-Z%]/g, (t) => {
            '%%' !== t && (r++, '%c' === t && (i = r));
          }),
            e.splice(i, 0, n);
        }),
          (e.save = function (t) {
            try {
              t ? e.storage.setItem('debug', t) : e.storage.removeItem('debug');
            } catch (t) {}
          }),
          (e.load = function () {
            let t;
            try {
              t = e.storage.getItem('debug');
            } catch (t) {}
            return (
              !t &&
                'undefined' != typeof process &&
                'env' in process &&
                (t = process.env.DEBUG),
              t
            );
          }),
          (e.useColors = function () {
            return (
              !(
                'undefined' == typeof window ||
                !window.process ||
                ('renderer' !== window.process.type && !window.process.__nwjs)
              ) ||
              (('undefined' == typeof navigator ||
                !navigator.userAgent ||
                !navigator.userAgent
                  .toLowerCase()
                  .match(/(edge|trident)\/(\d+)/)) &&
                (('undefined' != typeof document &&
                  document.documentElement &&
                  document.documentElement.style &&
                  document.documentElement.style.WebkitAppearance) ||
                  ('undefined' != typeof window &&
                    window.console &&
                    (window.console.firebug ||
                      (window.console.exception && window.console.table))) ||
                  ('undefined' != typeof navigator &&
                    navigator.userAgent &&
                    navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) &&
                    parseInt(RegExp.$1, 10) >= 31) ||
                  ('undefined' != typeof navigator &&
                    navigator.userAgent &&
                    navigator.userAgent
                      .toLowerCase()
                      .match(/applewebkit\/(\d+)/))))
            );
          }),
          (e.storage = (function () {
            try {
              return localStorage;
            } catch (t) {}
          })()),
          (e.destroy = (() => {
            let t = !1;
            return () => {
              t ||
                ((t = !0),
                console.warn(
                  'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.'
                ));
            };
          })()),
          (e.colors = [
            '#0000CC',
            '#0000FF',
            '#0033CC',
            '#0033FF',
            '#0066CC',
            '#0066FF',
            '#0099CC',
            '#0099FF',
            '#00CC00',
            '#00CC33',
            '#00CC66',
            '#00CC99',
            '#00CCCC',
            '#00CCFF',
            '#3300CC',
            '#3300FF',
            '#3333CC',
            '#3333FF',
            '#3366CC',
            '#3366FF',
            '#3399CC',
            '#3399FF',
            '#33CC00',
            '#33CC33',
            '#33CC66',
            '#33CC99',
            '#33CCCC',
            '#33CCFF',
            '#6600CC',
            '#6600FF',
            '#6633CC',
            '#6633FF',
            '#66CC00',
            '#66CC33',
            '#9900CC',
            '#9900FF',
            '#9933CC',
            '#9933FF',
            '#99CC00',
            '#99CC33',
            '#CC0000',
            '#CC0033',
            '#CC0066',
            '#CC0099',
            '#CC00CC',
            '#CC00FF',
            '#CC3300',
            '#CC3333',
            '#CC3366',
            '#CC3399',
            '#CC33CC',
            '#CC33FF',
            '#CC6600',
            '#CC6633',
            '#CC9900',
            '#CC9933',
            '#CCCC00',
            '#CCCC33',
            '#FF0000',
            '#FF0033',
            '#FF0066',
            '#FF0099',
            '#FF00CC',
            '#FF00FF',
            '#FF3300',
            '#FF3333',
            '#FF3366',
            '#FF3399',
            '#FF33CC',
            '#FF33FF',
            '#FF6600',
            '#FF6633',
            '#FF9900',
            '#FF9933',
            '#FFCC00',
            '#FFCC33',
          ]),
          (e.log = console.debug || console.log || (() => {})),
          (t.exports = n(727)(e));
        const { formatters: r } = t.exports;
        r.j = function (t) {
          try {
            return JSON.stringify(t);
          } catch (t) {
            return '[UnexpectedJSONParseError]: ' + t.message;
          }
        };
      },
      727: (t, e, n) => {
        t.exports = function (t) {
          function e(t) {
            let n,
              i,
              o,
              s = null;
            function a(...t) {
              if (!a.enabled) return;
              const r = a,
                i = Number(new Date()),
                o = i - (n || i);
              (r.diff = o),
                (r.prev = n),
                (r.curr = i),
                (n = i),
                (t[0] = e.coerce(t[0])),
                'string' != typeof t[0] && t.unshift('%O');
              let s = 0;
              (t[0] = t[0].replace(/%([a-zA-Z%])/g, (n, i) => {
                if ('%%' === n) return '%';
                s++;
                const o = e.formatters[i];
                if ('function' == typeof o) {
                  const e = t[s];
                  (n = o.call(r, e)), t.splice(s, 1), s--;
                }
                return n;
              })),
                e.formatArgs.call(r, t),
                (r.log || e.log).apply(r, t);
            }
            return (
              (a.namespace = t),
              (a.useColors = e.useColors()),
              (a.color = e.selectColor(t)),
              (a.extend = r),
              (a.destroy = e.destroy),
              Object.defineProperty(a, 'enabled', {
                enumerable: !0,
                configurable: !1,
                get: () =>
                  null !== s
                    ? s
                    : (i !== e.namespaces &&
                        ((i = e.namespaces), (o = e.enabled(t))),
                      o),
                set: (t) => {
                  s = t;
                },
              }),
              'function' == typeof e.init && e.init(a),
              a
            );
          }
          function r(t, n) {
            const r = e(this.namespace + (void 0 === n ? ':' : n) + t);
            return (r.log = this.log), r;
          }
          function i(t) {
            return t
              .toString()
              .substring(2, t.toString().length - 2)
              .replace(/\.\*\?$/, '*');
          }
          return (
            (e.debug = e),
            (e.default = e),
            (e.coerce = function (t) {
              return t instanceof Error ? t.stack || t.message : t;
            }),
            (e.disable = function () {
              const t = [
                ...e.names.map(i),
                ...e.skips.map(i).map((t) => '-' + t),
              ].join(',');
              return e.enable(''), t;
            }),
            (e.enable = function (t) {
              let n;
              e.save(t), (e.namespaces = t), (e.names = []), (e.skips = []);
              const r = ('string' == typeof t ? t : '').split(/[\s,]+/),
                i = r.length;
              for (n = 0; n < i; n++)
                r[n] &&
                  ('-' === (t = r[n].replace(/\*/g, '.*?'))[0]
                    ? e.skips.push(new RegExp('^' + t.substr(1) + '$'))
                    : e.names.push(new RegExp('^' + t + '$')));
            }),
            (e.enabled = function (t) {
              if ('*' === t[t.length - 1]) return !0;
              let n, r;
              for (n = 0, r = e.skips.length; n < r; n++)
                if (e.skips[n].test(t)) return !1;
              for (n = 0, r = e.names.length; n < r; n++)
                if (e.names[n].test(t)) return !0;
              return !1;
            }),
            (e.humanize = n(165)),
            (e.destroy = function () {
              console.warn(
                'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.'
              );
            }),
            Object.keys(t).forEach((n) => {
              e[n] = t[n];
            }),
            (e.names = []),
            (e.skips = []),
            (e.formatters = {}),
            (e.selectColor = function (t) {
              let n = 0;
              for (let e = 0; e < t.length; e++)
                (n = (n << 5) - n + t.charCodeAt(e)), (n |= 0);
              return e.colors[Math.abs(n) % e.colors.length];
            }),
            e.enable(e.load()),
            e
          );
        };
      },
      324: (t, e, n) => {
        'undefined' == typeof process ||
        'renderer' === process.type ||
        !0 === process.browser ||
        process.__nwjs
          ? (t.exports = n(977))
          : (t.exports = n(501));
      },
      501: (t, e, n) => {
        const r = n(224),
          i = n(837);
        (e.init = function (t) {
          t.inspectOpts = {};
          const n = Object.keys(e.inspectOpts);
          for (let r = 0; r < n.length; r++)
            t.inspectOpts[n[r]] = e.inspectOpts[n[r]];
        }),
          (e.log = function (...t) {
            return process.stderr.write(i.format(...t) + '\n');
          }),
          (e.formatArgs = function (n) {
            const { namespace: r, useColors: i } = this;
            if (i) {
              const e = this.color,
                i = '[3' + (e < 8 ? e : '8;5;' + e),
                o = `  ${i};1m${r} [0m`;
              (n[0] = o + n[0].split('\n').join('\n' + o)),
                n.push(i + 'm+' + t.exports.humanize(this.diff) + '[0m');
            } else
              n[0] =
                (e.inspectOpts.hideDate ? '' : new Date().toISOString() + ' ') +
                r +
                ' ' +
                n[0];
          }),
          (e.save = function (t) {
            t ? (process.env.DEBUG = t) : delete process.env.DEBUG;
          }),
          (e.load = function () {
            return process.env.DEBUG;
          }),
          (e.useColors = function () {
            return 'colors' in e.inspectOpts
              ? Boolean(e.inspectOpts.colors)
              : r.isatty(process.stderr.fd);
          }),
          (e.destroy = i.deprecate(() => {},
          'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.')),
          (e.colors = [6, 2, 3, 4, 5, 1]);
        try {
          const t = n(162);
          t &&
            (t.stderr || t).level >= 2 &&
            (e.colors = [
              20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57,
              62, 63, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99,
              112, 113, 128, 129, 134, 135, 148, 149, 160, 161, 162, 163, 164,
              165, 166, 167, 168, 169, 170, 171, 172, 173, 178, 179, 184, 185,
              196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208,
              209, 214, 215, 220, 221,
            ]);
        } catch (t) {}
        (e.inspectOpts = Object.keys(process.env)
          .filter((t) => /^debug_/i.test(t))
          .reduce((t, e) => {
            const n = e
              .substring(6)
              .toLowerCase()
              .replace(/_([a-z])/g, (t, e) => e.toUpperCase());
            let r = process.env[e];
            return (
              (r =
                !!/^(yes|on|true|enabled)$/i.test(r) ||
                (!/^(no|off|false|disabled)$/i.test(r) &&
                  ('null' === r ? null : Number(r)))),
              (t[n] = r),
              t
            );
          }, {})),
          (t.exports = n(727)(e));
        const { formatters: o } = t.exports;
        (o.o = function (t) {
          return (
            (this.inspectOpts.colors = this.useColors),
            i
              .inspect(t, this.inspectOpts)
              .split('\n')
              .map((t) => t.trim())
              .join(' ')
          );
        }),
          (o.O = function (t) {
            return (
              (this.inspectOpts.colors = this.useColors),
              i.inspect(t, this.inspectOpts)
            );
          });
      },
      688: (t, e, n) => {
        const r = n(147),
          i = n(17),
          o = n(37);
        function s(t) {
          console.log(`[dotenv][DEBUG] ${t}`);
        }
        const a = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/,
          c = /\\n/g,
          u = /\r\n|\n|\r/;
        function l(t, e) {
          const n = Boolean(e && e.debug),
            r = {};
          return (
            t
              .toString()
              .split(u)
              .forEach(function (t, e) {
                const i = t.match(a);
                if (null != i) {
                  const t = i[1];
                  let e = i[2] || '';
                  const n = e.length - 1,
                    o = '"' === e[0] && '"' === e[n];
                  ("'" === e[0] && "'" === e[n]) || o
                    ? ((e = e.substring(1, n)), o && (e = e.replace(c, '\n')))
                    : (e = e.trim()),
                    (r[t] = e);
                } else n && s(`did not match key and value when parsing line ${e + 1}: ${t}`);
              }),
            r
          );
        }
        (t.exports.config = function (t) {
          let e = i.resolve(process.cwd(), '.env'),
            n = 'utf8';
          const a = Boolean(t && t.debug);
          var c;
          t &&
            (null != t.path &&
              (e =
                '~' === (c = t.path)[0] ? i.join(o.homedir(), c.slice(1)) : c),
            null != t.encoding && (n = t.encoding));
          try {
            const t = l(r.readFileSync(e, { encoding: n }), { debug: a });
            return (
              Object.keys(t).forEach(function (e) {
                Object.prototype.hasOwnProperty.call(process.env, e)
                  ? a &&
                    s(
                      `"${e}" is already defined in \`process.env\` and will not be overwritten`
                    )
                  : (process.env[e] = t[e]);
              }),
              { parsed: t }
            );
          } catch (t) {
            return { error: t };
          }
        }),
          (t.exports.parse = l);
      },
      85: (t, e, n) => {
        'use strict';
        Object.defineProperty(e, '__esModule', { value: !0 }),
          (e.getApplicativeComposition = e.getApplicativeMonoid = void 0);
        var r = n(922),
          i = n(758),
          o = n(52);
        (e.getApplicativeMonoid = function (t) {
          var e = r.getApplySemigroup(t);
          return function (n) {
            return { concat: e(n).concat, empty: t.of(n.empty) };
          };
        }),
          (e.getApplicativeComposition = function (t, e) {
            var n = o.getFunctorComposition(t, e).map,
              s = r.ap(t, e);
            return {
              map: n,
              of: function (n) {
                return t.of(e.of(n));
              },
              ap: function (t, e) {
                return i.pipe(t, s(e));
              },
            };
          });
      },
      922: (t, e, n) => {
        'use strict';
        Object.defineProperty(e, '__esModule', { value: !0 }),
          (e.sequenceS =
            e.sequenceT =
            e.getApplySemigroup =
            e.apS =
            e.apSecond =
            e.apFirst =
            e.ap =
              void 0);
        var r = n(758);
        function i(t, e, n) {
          return function (r) {
            for (var o = Array(n.length + 1), s = 0; s < n.length; s++)
              o[s] = n[s];
            return (
              (o[n.length] = r), 0 === e ? t.apply(null, o) : i(t, e - 1, o)
            );
          };
        }
        (e.ap = function (t, e) {
          return function (n) {
            return function (r) {
              return t.ap(
                t.map(r, function (t) {
                  return function (n) {
                    return e.ap(t, n);
                  };
                }),
                n
              );
            };
          };
        }),
          (e.apFirst = function (t) {
            return function (e) {
              return function (n) {
                return t.ap(
                  t.map(n, function (t) {
                    return function () {
                      return t;
                    };
                  }),
                  e
                );
              };
            };
          }),
          (e.apSecond = function (t) {
            return function (e) {
              return function (n) {
                return t.ap(
                  t.map(n, function () {
                    return function (t) {
                      return t;
                    };
                  }),
                  e
                );
              };
            };
          }),
          (e.apS = function (t) {
            return function (e, n) {
              return function (r) {
                return t.ap(
                  t.map(r, function (t) {
                    return function (n) {
                      var r;
                      return Object.assign({}, t, (((r = {})[e] = n), r));
                    };
                  }),
                  n
                );
              };
            };
          }),
          (e.getApplySemigroup = function (t) {
            return function (e) {
              return {
                concat: function (n, r) {
                  return t.ap(
                    t.map(n, function (t) {
                      return function (n) {
                        return e.concat(t, n);
                      };
                    }),
                    r
                  );
                },
              };
            };
          });
        var o = {
          1: function (t) {
            return [t];
          },
          2: function (t) {
            return function (e) {
              return [t, e];
            };
          },
          3: function (t) {
            return function (e) {
              return function (n) {
                return [t, e, n];
              };
            };
          },
          4: function (t) {
            return function (e) {
              return function (n) {
                return function (r) {
                  return [t, e, n, r];
                };
              };
            };
          },
          5: function (t) {
            return function (e) {
              return function (n) {
                return function (r) {
                  return function (i) {
                    return [t, e, n, r, i];
                  };
                };
              };
            };
          },
        };
        function s(t) {
          return o.hasOwnProperty(t) || (o[t] = i(r.tuple, t - 1, [])), o[t];
        }
        (e.sequenceT = function (t) {
          return function () {
            for (var e = [], n = 0; n < arguments.length; n++)
              e[n] = arguments[n];
            for (
              var r = e.length, i = s(r), o = t.map(e[0], i), a = 1;
              a < r;
              a++
            )
              o = t.ap(o, e[a]);
            return o;
          };
        }),
          (e.sequenceS = function (t) {
            return function (e) {
              for (
                var n = Object.keys(e),
                  r = n.length,
                  o = (function (t) {
                    var e = t.length;
                    switch (e) {
                      case 1:
                        return function (e) {
                          var n;
                          return ((n = {})[t[0]] = e), n;
                        };
                      case 2:
                        return function (e) {
                          return function (n) {
                            var r;
                            return ((r = {})[t[0]] = e), (r[t[1]] = n), r;
                          };
                        };
                      case 3:
                        return function (e) {
                          return function (n) {
                            return function (r) {
                              var i;
                              return (
                                ((i = {})[t[0]] = e),
                                (i[t[1]] = n),
                                (i[t[2]] = r),
                                i
                              );
                            };
                          };
                        };
                      case 4:
                        return function (e) {
                          return function (n) {
                            return function (r) {
                              return function (i) {
                                var o;
                                return (
                                  ((o = {})[t[0]] = e),
                                  (o[t[1]] = n),
                                  (o[t[2]] = r),
                                  (o[t[3]] = i),
                                  o
                                );
                              };
                            };
                          };
                        };
                      case 5:
                        return function (e) {
                          return function (n) {
                            return function (r) {
                              return function (i) {
                                return function (o) {
                                  var s;
                                  return (
                                    ((s = {})[t[0]] = e),
                                    (s[t[1]] = n),
                                    (s[t[2]] = r),
                                    (s[t[3]] = i),
                                    (s[t[4]] = o),
                                    s
                                  );
                                };
                              };
                            };
                          };
                        };
                      default:
                        return i(
                          function () {
                            for (var n = [], r = 0; r < arguments.length; r++)
                              n[r] = arguments[r];
                            for (var i = {}, o = 0; o < e; o++) i[t[o]] = n[o];
                            return i;
                          },
                          e - 1,
                          []
                        );
                    }
                  })(n),
                  s = t.map(e[n[0]], o),
                  a = 1;
                a < r;
                a++
              )
                s = t.ap(s, e[n[a]]);
              return s;
            };
          });
      },
      409: (t, e) => {
        'use strict';
        Object.defineProperty(e, '__esModule', { value: !0 }),
          (e.bind = e.chainFirst = void 0),
          (e.chainFirst = function (t) {
            return function (e) {
              return function (n) {
                return t.chain(n, function (n) {
                  return t.map(e(n), function () {
                    return n;
                  });
                });
              };
            };
          }),
          (e.bind = function (t) {
            return function (e, n) {
              return function (r) {
                return t.chain(r, function (r) {
                  return t.map(n(r), function (t) {
                    var n;
                    return Object.assign({}, r, (((n = {})[e] = t), n));
                  });
                });
              };
            };
          });
      },
      27: (t, e) => {
        'use strict';
        Object.defineProperty(e, '__esModule', { value: !0 }),
          (e.tailRec = void 0),
          (e.tailRec = function (t, e) {
            for (var n = e(t); 'Left' === n._tag; ) n = e(n.left);
            return n.right;
          });
      },
      71: function (t, e, n) {
        'use strict';
        var r =
            (this && this.__createBinding) ||
            (Object.create
              ? function (t, e, n, r) {
                  void 0 === r && (r = n),
                    Object.defineProperty(t, r, {
                      enumerable: !0,
                      get: function () {
                        return e[n];
                      },
                    });
                }
              : function (t, e, n, r) {
                  void 0 === r && (r = n), (t[r] = e[n]);
                }),
          i =
            (this && this.__setModuleDefault) ||
            (Object.create
              ? function (t, e) {
                  Object.defineProperty(t, 'default', {
                    enumerable: !0,
                    value: e,
                  });
                }
              : function (t, e) {
                  t.default = e;
                }),
          o =
            (this && this.__importStar) ||
            function (t) {
              if (t && t.__esModule) return t;
              var e = {};
              if (null != t)
                for (var n in t)
                  'default' !== n &&
                    Object.prototype.hasOwnProperty.call(t, n) &&
                    r(e, t, n);
              return i(e, t), e;
            };
        Object.defineProperty(e, '__esModule', { value: !0 }),
          (e.fold =
            e.match =
            e.foldW =
            e.matchW =
            e.isRight =
            e.isLeft =
            e.fromOption =
            e.fromPredicate =
            e.FromEither =
            e.MonadThrow =
            e.throwError =
            e.ChainRec =
            e.Extend =
            e.extend =
            e.Alt =
            e.alt =
            e.altW =
            e.Bifunctor =
            e.mapLeft =
            e.bimap =
            e.Traversable =
            e.sequence =
            e.traverse =
            e.Foldable =
            e.reduceRight =
            e.foldMap =
            e.reduce =
            e.Monad =
            e.Chain =
            e.chain =
            e.chainW =
            e.Applicative =
            e.Apply =
            e.ap =
            e.apW =
            e.Pointed =
            e.of =
            e.Functor =
            e.map =
            e.getAltValidation =
            e.getApplicativeValidation =
            e.getWitherable =
            e.getFilterable =
            e.getCompactable =
            e.getSemigroup =
            e.getEq =
            e.getShow =
            e.URI =
            e.right =
            e.left =
              void 0),
          (e.getValidation =
            e.getValidationMonoid =
            e.getValidationSemigroup =
            e.getApplyMonoid =
            e.getApplySemigroup =
            e.either =
            e.stringifyJSON =
            e.parseJSON =
            e.sequenceArray =
            e.traverseArray =
            e.traverseArrayWithIndex =
            e.traverseReadonlyArrayWithIndex =
            e.traverseReadonlyNonEmptyArrayWithIndex =
            e.ApT =
            e.apSW =
            e.apS =
            e.bindW =
            e.bind =
            e.bindTo =
            e.Do =
            e.exists =
            e.elem =
            e.toError =
            e.toUnion =
            e.chainNullableK =
            e.fromNullableK =
            e.tryCatchK =
            e.tryCatch =
            e.fromNullable =
            e.orElse =
            e.orElseW =
            e.swap =
            e.filterOrElseW =
            e.filterOrElse =
            e.chainOptionK =
            e.fromOptionK =
            e.duplicate =
            e.flatten =
            e.flattenW =
            e.chainFirstW =
            e.chainFirst =
            e.apSecond =
            e.apFirst =
            e.flap =
            e.getOrElse =
            e.getOrElseW =
              void 0);
        var s = n(85),
          a = n(922),
          c = n(409),
          u = n(27),
          l = n(671),
          f = n(758),
          h = n(52),
          p = o(n(670)),
          d = n(986),
          g = n(48);
        (e.left = p.left), (e.right = p.right);
        var m = function (t, n) {
            return f.pipe(t, e.map(n));
          },
          y = function (t, n) {
            return f.pipe(t, e.ap(n));
          },
          v = function (t, n) {
            return f.pipe(t, e.chain(n));
          },
          b = function (t, n, r) {
            return f.pipe(t, e.reduce(n, r));
          },
          w = function (t) {
            return function (n, r) {
              var i = e.foldMap(t);
              return f.pipe(n, i(r));
            };
          },
          O = function (t, n, r) {
            return f.pipe(t, e.reduceRight(n, r));
          },
          _ = function (t) {
            var n = e.traverse(t);
            return function (t, e) {
              return f.pipe(t, n(e));
            };
          },
          C = function (t, n, r) {
            return f.pipe(t, e.bimap(n, r));
          },
          j = function (t, n) {
            return f.pipe(t, e.mapLeft(n));
          },
          A = function (t, n) {
            return f.pipe(t, e.alt(n));
          },
          E = function (t, n) {
            return f.pipe(t, e.extend(n));
          },
          k = function (t, n) {
            return u.tailRec(n(t), function (t) {
              return e.isLeft(t)
                ? e.right(e.left(t.left))
                : e.isLeft(t.right)
                ? e.left(n(t.right.left))
                : e.right(e.right(t.right.right));
            });
          };
        (e.URI = 'Either'),
          (e.getShow = function (t, n) {
            return {
              show: function (r) {
                return e.isLeft(r)
                  ? 'left(' + t.show(r.left) + ')'
                  : 'right(' + n.show(r.right) + ')';
              },
            };
          }),
          (e.getEq = function (t, n) {
            return {
              equals: function (r, i) {
                return (
                  r === i ||
                  (e.isLeft(r)
                    ? e.isLeft(i) && t.equals(r.left, i.left)
                    : e.isRight(i) && n.equals(r.right, i.right))
                );
              },
            };
          }),
          (e.getSemigroup = function (t) {
            return {
              concat: function (n, r) {
                return e.isLeft(r)
                  ? n
                  : e.isLeft(n)
                  ? r
                  : e.right(t.concat(n.right, r.right));
              },
            };
          }),
          (e.getCompactable = function (t) {
            var n = e.left(t.empty);
            return {
              URI: e.URI,
              _E: void 0,
              compact: function (t) {
                return e.isLeft(t)
                  ? t
                  : 'None' === t.right._tag
                  ? n
                  : e.right(t.right.value);
              },
              separate: function (t) {
                return e.isLeft(t)
                  ? d.separated(t, t)
                  : e.isLeft(t.right)
                  ? d.separated(e.right(t.right.left), n)
                  : d.separated(n, e.right(t.right.right));
              },
            };
          }),
          (e.getFilterable = function (t) {
            var n = e.left(t.empty),
              r = e.getCompactable(t),
              i = r.compact,
              o = r.separate;
            return {
              URI: e.URI,
              _E: void 0,
              map: m,
              compact: i,
              separate: o,
              filter: function (t, r) {
                return e.isLeft(t) || r(t.right) ? t : n;
              },
              filterMap: function (t, r) {
                if (e.isLeft(t)) return t;
                var i = r(t.right);
                return 'None' === i._tag ? n : e.right(i.value);
              },
              partition: function (t, r) {
                return e.isLeft(t)
                  ? d.separated(t, t)
                  : r(t.right)
                  ? d.separated(n, e.right(t.right))
                  : d.separated(e.right(t.right), n);
              },
              partitionMap: function (t, r) {
                if (e.isLeft(t)) return d.separated(t, t);
                var i = r(t.right);
                return e.isLeft(i)
                  ? d.separated(e.right(i.left), n)
                  : d.separated(n, e.right(i.right));
              },
            };
          }),
          (e.getWitherable = function (t) {
            var n = e.getFilterable(t),
              r = e.getCompactable(t);
            return {
              URI: e.URI,
              _E: void 0,
              map: m,
              compact: n.compact,
              separate: n.separate,
              filter: n.filter,
              filterMap: n.filterMap,
              partition: n.partition,
              partitionMap: n.partitionMap,
              traverse: _,
              sequence: e.sequence,
              reduce: b,
              foldMap: w,
              reduceRight: O,
              wither: g.witherDefault(e.Traversable, r),
              wilt: g.wiltDefault(e.Traversable, r),
            };
          }),
          (e.getApplicativeValidation = function (t) {
            return {
              URI: e.URI,
              _E: void 0,
              map: m,
              ap: function (n, r) {
                return e.isLeft(n)
                  ? e.isLeft(r)
                    ? e.left(t.concat(n.left, r.left))
                    : n
                  : e.isLeft(r)
                  ? r
                  : e.right(n.right(r.right));
              },
              of: e.of,
            };
          }),
          (e.getAltValidation = function (t) {
            return {
              URI: e.URI,
              _E: void 0,
              map: m,
              alt: function (n, r) {
                if (e.isRight(n)) return n;
                var i = r();
                return e.isLeft(i) ? e.left(t.concat(n.left, i.left)) : i;
              },
            };
          }),
          (e.map = function (t) {
            return function (n) {
              return e.isLeft(n) ? n : e.right(t(n.right));
            };
          }),
          (e.Functor = { URI: e.URI, map: m }),
          (e.of = e.right),
          (e.Pointed = { URI: e.URI, of: e.of }),
          (e.apW = function (t) {
            return function (n) {
              return e.isLeft(n)
                ? n
                : e.isLeft(t)
                ? t
                : e.right(n.right(t.right));
            };
          }),
          (e.ap = e.apW),
          (e.Apply = { URI: e.URI, map: m, ap: y }),
          (e.Applicative = { URI: e.URI, map: m, ap: y, of: e.of }),
          (e.chainW = function (t) {
            return function (n) {
              return e.isLeft(n) ? n : t(n.right);
            };
          }),
          (e.chain = e.chainW),
          (e.Chain = { URI: e.URI, map: m, ap: y, chain: v }),
          (e.Monad = { URI: e.URI, map: m, ap: y, of: e.of, chain: v }),
          (e.reduce = function (t, n) {
            return function (r) {
              return e.isLeft(r) ? t : n(t, r.right);
            };
          }),
          (e.foldMap = function (t) {
            return function (n) {
              return function (r) {
                return e.isLeft(r) ? t.empty : n(r.right);
              };
            };
          }),
          (e.reduceRight = function (t, n) {
            return function (r) {
              return e.isLeft(r) ? t : n(r.right, t);
            };
          }),
          (e.Foldable = { URI: e.URI, reduce: b, foldMap: w, reduceRight: O }),
          (e.traverse = function (t) {
            return function (n) {
              return function (r) {
                return e.isLeft(r)
                  ? t.of(e.left(r.left))
                  : t.map(n(r.right), e.right);
              };
            };
          }),
          (e.sequence = function (t) {
            return function (n) {
              return e.isLeft(n)
                ? t.of(e.left(n.left))
                : t.map(n.right, e.right);
            };
          }),
          (e.Traversable = {
            URI: e.URI,
            map: m,
            reduce: b,
            foldMap: w,
            reduceRight: O,
            traverse: _,
            sequence: e.sequence,
          }),
          (e.bimap = function (t, n) {
            return function (r) {
              return e.isLeft(r) ? e.left(t(r.left)) : e.right(n(r.right));
            };
          }),
          (e.mapLeft = function (t) {
            return function (n) {
              return e.isLeft(n) ? e.left(t(n.left)) : n;
            };
          }),
          (e.Bifunctor = { URI: e.URI, bimap: C, mapLeft: j }),
          (e.altW = function (t) {
            return function (n) {
              return e.isLeft(n) ? t() : n;
            };
          }),
          (e.alt = e.altW),
          (e.Alt = { URI: e.URI, map: m, alt: A }),
          (e.extend = function (t) {
            return function (n) {
              return e.isLeft(n) ? n : e.right(t(n));
            };
          }),
          (e.Extend = { URI: e.URI, map: m, extend: E }),
          (e.ChainRec = { URI: e.URI, map: m, ap: y, chain: v, chainRec: k }),
          (e.throwError = e.left),
          (e.MonadThrow = {
            URI: e.URI,
            map: m,
            ap: y,
            of: e.of,
            chain: v,
            throwError: e.throwError,
          }),
          (e.FromEither = { URI: e.URI, fromEither: f.identity }),
          (e.fromPredicate = l.fromPredicate(e.FromEither)),
          (e.fromOption = l.fromOption(e.FromEither)),
          (e.isLeft = p.isLeft),
          (e.isRight = p.isRight),
          (e.matchW = function (t, n) {
            return function (r) {
              return e.isLeft(r) ? t(r.left) : n(r.right);
            };
          }),
          (e.foldW = e.matchW),
          (e.match = e.matchW),
          (e.fold = e.match),
          (e.getOrElseW = function (t) {
            return function (n) {
              return e.isLeft(n) ? t(n.left) : n.right;
            };
          }),
          (e.getOrElse = e.getOrElseW),
          (e.flap = h.flap(e.Functor)),
          (e.apFirst = a.apFirst(e.Apply)),
          (e.apSecond = a.apSecond(e.Apply)),
          (e.chainFirst = c.chainFirst(e.Chain)),
          (e.chainFirstW = e.chainFirst),
          (e.flattenW = e.chainW(f.identity)),
          (e.flatten = e.flattenW),
          (e.duplicate = e.extend(f.identity)),
          (e.fromOptionK = l.fromOptionK(e.FromEither)),
          (e.chainOptionK = l.chainOptionK(e.FromEither, e.Chain)),
          (e.filterOrElse = l.filterOrElse(e.FromEither, e.Chain)),
          (e.filterOrElseW = e.filterOrElse),
          (e.swap = function (t) {
            return e.isLeft(t) ? e.right(t.left) : e.left(t.right);
          }),
          (e.orElseW = function (t) {
            return function (n) {
              return e.isLeft(n) ? t(n.left) : n;
            };
          }),
          (e.orElse = e.orElseW),
          (e.fromNullable = function (t) {
            return function (n) {
              return null == n ? e.left(t) : e.right(n);
            };
          }),
          (e.tryCatch = function (t, n) {
            try {
              return e.right(t());
            } catch (t) {
              return e.left(n(t));
            }
          }),
          (e.tryCatchK = function (t, n) {
            return function () {
              for (var r = [], i = 0; i < arguments.length; i++)
                r[i] = arguments[i];
              return e.tryCatch(function () {
                return t.apply(void 0, r);
              }, n);
            };
          }),
          (e.fromNullableK = function (t) {
            var n = e.fromNullable(t);
            return function (t) {
              return f.flow(t, n);
            };
          }),
          (e.chainNullableK = function (t) {
            var n = e.fromNullableK(t);
            return function (t) {
              return e.chain(n(t));
            };
          }),
          (e.toUnion = e.foldW(f.identity, f.identity)),
          (e.toError = function (t) {
            return t instanceof Error ? t : new Error(String(t));
          }),
          (e.elem = function t(n) {
            return function (r, i) {
              if (void 0 === i) {
                var o = t(n);
                return function (t) {
                  return o(r, t);
                };
              }
              return !e.isLeft(i) && n.equals(r, i.right);
            };
          }),
          (e.exists = function (t) {
            return function (n) {
              return !e.isLeft(n) && t(n.right);
            };
          }),
          (e.Do = e.of(p.emptyRecord)),
          (e.bindTo = h.bindTo(e.Functor)),
          (e.bind = c.bind(e.Chain)),
          (e.bindW = e.bind),
          (e.apS = a.apS(e.Apply)),
          (e.apSW = e.apS),
          (e.ApT = e.of(p.emptyReadonlyArray)),
          (e.traverseReadonlyNonEmptyArrayWithIndex = function (t) {
            return function (n) {
              var r = t(0, p.head(n));
              if (e.isLeft(r)) return r;
              for (var i = [r.right], o = 1; o < n.length; o++) {
                var s = t(o, n[o]);
                if (e.isLeft(s)) return s;
                i.push(s.right);
              }
              return e.right(i);
            };
          }),
          (e.traverseReadonlyArrayWithIndex = function (t) {
            var n = e.traverseReadonlyNonEmptyArrayWithIndex(t);
            return function (t) {
              return p.isNonEmpty(t) ? n(t) : e.ApT;
            };
          }),
          (e.traverseArrayWithIndex = e.traverseReadonlyArrayWithIndex),
          (e.traverseArray = function (t) {
            return e.traverseReadonlyArrayWithIndex(function (e, n) {
              return t(n);
            });
          }),
          (e.sequenceArray = e.traverseArray(f.identity)),
          (e.parseJSON = function (t, n) {
            return e.tryCatch(function () {
              return JSON.parse(t);
            }, n);
          }),
          (e.stringifyJSON = function (t, n) {
            return e.tryCatch(function () {
              var e = JSON.stringify(t);
              if ('string' != typeof e)
                throw new Error('Converting unsupported structure to JSON');
              return e;
            }, n);
          }),
          (e.either = {
            URI: e.URI,
            map: m,
            of: e.of,
            ap: y,
            chain: v,
            reduce: b,
            foldMap: w,
            reduceRight: O,
            traverse: _,
            sequence: e.sequence,
            bimap: C,
            mapLeft: j,
            alt: A,
            extend: E,
            chainRec: k,
            throwError: e.throwError,
          }),
          (e.getApplySemigroup = a.getApplySemigroup(e.Apply)),
          (e.getApplyMonoid = s.getApplicativeMonoid(e.Applicative)),
          (e.getValidationSemigroup = function (t, n) {
            return a.getApplySemigroup(e.getApplicativeValidation(t))(n);
          }),
          (e.getValidationMonoid = function (t, n) {
            return s.getApplicativeMonoid(e.getApplicativeValidation(t))(n);
          }),
          (e.getValidation = function (t) {
            var n = e.getApplicativeValidation(t).ap,
              r = e.getAltValidation(t).alt;
            return {
              URI: e.URI,
              _E: void 0,
              map: m,
              of: e.of,
              chain: v,
              bimap: C,
              mapLeft: j,
              reduce: b,
              foldMap: w,
              reduceRight: O,
              extend: E,
              traverse: _,
              sequence: e.sequence,
              chainRec: k,
              throwError: e.throwError,
              ap: n,
              alt: r,
            };
          });
      },
      671: function (t, e, n) {
        'use strict';
        var r =
            (this && this.__createBinding) ||
            (Object.create
              ? function (t, e, n, r) {
                  void 0 === r && (r = n),
                    Object.defineProperty(t, r, {
                      enumerable: !0,
                      get: function () {
                        return e[n];
                      },
                    });
                }
              : function (t, e, n, r) {
                  void 0 === r && (r = n), (t[r] = e[n]);
                }),
          i =
            (this && this.__setModuleDefault) ||
            (Object.create
              ? function (t, e) {
                  Object.defineProperty(t, 'default', {
                    enumerable: !0,
                    value: e,
                  });
                }
              : function (t, e) {
                  t.default = e;
                }),
          o =
            (this && this.__importStar) ||
            function (t) {
              if (t && t.__esModule) return t;
              var e = {};
              if (null != t)
                for (var n in t)
                  'default' !== n &&
                    Object.prototype.hasOwnProperty.call(t, n) &&
                    r(e, t, n);
              return i(e, t), e;
            };
        Object.defineProperty(e, '__esModule', { value: !0 }),
          (e.filterOrElse =
            e.chainEitherK =
            e.fromEitherK =
            e.chainOptionK =
            e.fromOptionK =
            e.fromPredicate =
            e.fromOption =
              void 0);
        var s = n(758),
          a = o(n(670));
        function c(t) {
          return function (e) {
            return function (n) {
              return t.fromEither(a.isNone(n) ? a.left(e()) : a.right(n.value));
            };
          };
        }
        function u(t) {
          var e = c(t);
          return function (t) {
            var n = e(t);
            return function (t) {
              return s.flow(t, n);
            };
          };
        }
        function l(t) {
          return function (e) {
            return s.flow(e, t.fromEither);
          };
        }
        (e.fromOption = c),
          (e.fromPredicate = function (t) {
            return function (e, n) {
              return function (r) {
                return t.fromEither(e(r) ? a.right(r) : a.left(n(r)));
              };
            };
          }),
          (e.fromOptionK = u),
          (e.chainOptionK = function (t, e) {
            var n = u(t);
            return function (t) {
              var r = n(t);
              return function (t) {
                return function (n) {
                  return e.chain(n, r(t));
                };
              };
            };
          }),
          (e.fromEitherK = l),
          (e.chainEitherK = function (t, e) {
            var n = l(t);
            return function (t) {
              return function (r) {
                return e.chain(r, n(t));
              };
            };
          }),
          (e.filterOrElse = function (t, e) {
            return function (n, r) {
              return function (i) {
                return e.chain(i, function (e) {
                  return t.fromEither(n(e) ? a.right(e) : a.left(r(e)));
                });
              };
            };
          });
      },
      52: (t, e, n) => {
        'use strict';
        Object.defineProperty(e, '__esModule', { value: !0 }),
          (e.getFunctorComposition = e.bindTo = e.flap = e.map = void 0);
        var r = n(758);
        function i(t, e) {
          return function (n) {
            return function (r) {
              return t.map(r, function (t) {
                return e.map(t, n);
              });
            };
          };
        }
        (e.map = i),
          (e.flap = function (t) {
            return function (e) {
              return function (n) {
                return t.map(n, function (t) {
                  return t(e);
                });
              };
            };
          }),
          (e.bindTo = function (t) {
            return function (e) {
              return function (n) {
                return t.map(n, function (t) {
                  var n;
                  return ((n = {})[e] = t), n;
                });
              };
            };
          }),
          (e.getFunctorComposition = function (t, e) {
            var n = i(t, e);
            return {
              map: function (t, e) {
                return r.pipe(t, n(e));
              },
            };
          });
      },
      986: (t, e, n) => {
        'use strict';
        Object.defineProperty(e, '__esModule', { value: !0 }),
          (e.right =
            e.left =
            e.flap =
            e.Functor =
            e.Bifunctor =
            e.URI =
            e.bimap =
            e.mapLeft =
            e.map =
            e.separated =
              void 0);
        var r = n(758),
          i = n(52);
        (e.separated = function (t, e) {
          return { left: t, right: e };
        }),
          (e.map = function (t) {
            return function (n) {
              return e.separated(e.left(n), t(e.right(n)));
            };
          }),
          (e.mapLeft = function (t) {
            return function (n) {
              return e.separated(t(e.left(n)), e.right(n));
            };
          }),
          (e.bimap = function (t, n) {
            return function (r) {
              return e.separated(t(e.left(r)), n(e.right(r)));
            };
          }),
          (e.URI = 'Separated'),
          (e.Bifunctor = {
            URI: e.URI,
            mapLeft: function (t, n) {
              return r.pipe(t, e.mapLeft(n));
            },
            bimap: function (t, n, i) {
              return r.pipe(t, e.bimap(n, i));
            },
          }),
          (e.Functor = {
            URI: e.URI,
            map: function (t, n) {
              return r.pipe(t, e.map(n));
            },
          }),
          (e.flap = i.flap(e.Functor)),
          (e.left = function (t) {
            return t.left;
          }),
          (e.right = function (t) {
            return t.right;
          });
      },
      48: function (t, e, n) {
        'use strict';
        var r =
            (this && this.__createBinding) ||
            (Object.create
              ? function (t, e, n, r) {
                  void 0 === r && (r = n),
                    Object.defineProperty(t, r, {
                      enumerable: !0,
                      get: function () {
                        return e[n];
                      },
                    });
                }
              : function (t, e, n, r) {
                  void 0 === r && (r = n), (t[r] = e[n]);
                }),
          i =
            (this && this.__setModuleDefault) ||
            (Object.create
              ? function (t, e) {
                  Object.defineProperty(t, 'default', {
                    enumerable: !0,
                    value: e,
                  });
                }
              : function (t, e) {
                  t.default = e;
                }),
          o =
            (this && this.__importStar) ||
            function (t) {
              if (t && t.__esModule) return t;
              var e = {};
              if (null != t)
                for (var n in t)
                  'default' !== n &&
                    Object.prototype.hasOwnProperty.call(t, n) &&
                    r(e, t, n);
              return i(e, t), e;
            };
        Object.defineProperty(e, '__esModule', { value: !0 }),
          (e.filterE = e.witherDefault = e.wiltDefault = void 0);
        var s = o(n(670));
        (e.wiltDefault = function (t, e) {
          return function (n) {
            var r = t.traverse(n);
            return function (t, i) {
              return n.map(r(t, i), e.separate);
            };
          };
        }),
          (e.witherDefault = function (t, e) {
            return function (n) {
              var r = t.traverse(n);
              return function (t, i) {
                return n.map(r(t, i), e.compact);
              };
            };
          }),
          (e.filterE = function (t) {
            return function (e) {
              var n = t.wither(e);
              return function (t) {
                return function (r) {
                  return n(r, function (n) {
                    return e.map(t(n), function (t) {
                      return t ? s.some(n) : s.none;
                    });
                  });
                };
              };
            };
          });
      },
      758: (t, e) => {
        'use strict';
        function n(t) {
          return t;
        }
        function r(t) {
          return function () {
            return t;
          };
        }
        function i(t, e, n, r, i, o, s, a, c) {
          switch (arguments.length) {
            case 1:
              return t;
            case 2:
              return function () {
                return e(t.apply(this, arguments));
              };
            case 3:
              return function () {
                return n(e(t.apply(this, arguments)));
              };
            case 4:
              return function () {
                return r(n(e(t.apply(this, arguments))));
              };
            case 5:
              return function () {
                return i(r(n(e(t.apply(this, arguments)))));
              };
            case 6:
              return function () {
                return o(i(r(n(e(t.apply(this, arguments))))));
              };
            case 7:
              return function () {
                return s(o(i(r(n(e(t.apply(this, arguments)))))));
              };
            case 8:
              return function () {
                return a(s(o(i(r(n(e(t.apply(this, arguments))))))));
              };
            case 9:
              return function () {
                return c(a(s(o(i(r(n(e(t.apply(this, arguments)))))))));
              };
          }
        }
        function o(t) {
          throw new Error(
            'Called `absurd` function which should be uncallable'
          );
        }
        Object.defineProperty(e, '__esModule', { value: !0 }),
          (e.getEndomorphismMonoid =
            e.not =
            e.SK =
            e.hole =
            e.pipe =
            e.untupled =
            e.tupled =
            e.absurd =
            e.decrement =
            e.increment =
            e.tuple =
            e.flow =
            e.flip =
            e.constVoid =
            e.constUndefined =
            e.constNull =
            e.constFalse =
            e.constTrue =
            e.constant =
            e.unsafeCoerce =
            e.identity =
            e.apply =
            e.getRing =
            e.getSemiring =
            e.getMonoid =
            e.getSemigroup =
            e.getBooleanAlgebra =
              void 0),
          (e.getBooleanAlgebra = function (t) {
            return function () {
              return {
                meet: function (e, n) {
                  return function (r) {
                    return t.meet(e(r), n(r));
                  };
                },
                join: function (e, n) {
                  return function (r) {
                    return t.join(e(r), n(r));
                  };
                },
                zero: function () {
                  return t.zero;
                },
                one: function () {
                  return t.one;
                },
                implies: function (e, n) {
                  return function (r) {
                    return t.implies(e(r), n(r));
                  };
                },
                not: function (e) {
                  return function (n) {
                    return t.not(e(n));
                  };
                },
              };
            };
          }),
          (e.getSemigroup = function (t) {
            return function () {
              return {
                concat: function (e, n) {
                  return function (r) {
                    return t.concat(e(r), n(r));
                  };
                },
              };
            };
          }),
          (e.getMonoid = function (t) {
            var n = e.getSemigroup(t);
            return function () {
              return {
                concat: n().concat,
                empty: function () {
                  return t.empty;
                },
              };
            };
          }),
          (e.getSemiring = function (t) {
            return {
              add: function (e, n) {
                return function (r) {
                  return t.add(e(r), n(r));
                };
              },
              zero: function () {
                return t.zero;
              },
              mul: function (e, n) {
                return function (r) {
                  return t.mul(e(r), n(r));
                };
              },
              one: function () {
                return t.one;
              },
            };
          }),
          (e.getRing = function (t) {
            var n = e.getSemiring(t);
            return {
              add: n.add,
              mul: n.mul,
              one: n.one,
              zero: n.zero,
              sub: function (e, n) {
                return function (r) {
                  return t.sub(e(r), n(r));
                };
              },
            };
          }),
          (e.apply = function (t) {
            return function (e) {
              return e(t);
            };
          }),
          (e.identity = n),
          (e.unsafeCoerce = n),
          (e.constant = r),
          (e.constTrue = r(!0)),
          (e.constFalse = r(!1)),
          (e.constNull = r(null)),
          (e.constUndefined = r(void 0)),
          (e.constVoid = e.constUndefined),
          (e.flip = function (t) {
            return function (e, n) {
              return t(n, e);
            };
          }),
          (e.flow = i),
          (e.tuple = function () {
            for (var t = [], e = 0; e < arguments.length; e++)
              t[e] = arguments[e];
            return t;
          }),
          (e.increment = function (t) {
            return t + 1;
          }),
          (e.decrement = function (t) {
            return t - 1;
          }),
          (e.absurd = o),
          (e.tupled = function (t) {
            return function (e) {
              return t.apply(void 0, e);
            };
          }),
          (e.untupled = function (t) {
            return function () {
              for (var e = [], n = 0; n < arguments.length; n++)
                e[n] = arguments[n];
              return t(e);
            };
          }),
          (e.pipe = function (t, e, n, r, i, o, s, a, c) {
            switch (arguments.length) {
              case 1:
                return t;
              case 2:
                return e(t);
              case 3:
                return n(e(t));
              case 4:
                return r(n(e(t)));
              case 5:
                return i(r(n(e(t))));
              case 6:
                return o(i(r(n(e(t)))));
              case 7:
                return s(o(i(r(n(e(t))))));
              case 8:
                return a(s(o(i(r(n(e(t)))))));
              case 9:
                return c(a(s(o(i(r(n(e(t))))))));
              default:
                for (var u = arguments[0], l = 1; l < arguments.length; l++)
                  u = arguments[l](u);
                return u;
            }
          }),
          (e.hole = o),
          (e.SK = function (t, e) {
            return e;
          }),
          (e.not = function (t) {
            return function (e) {
              return !t(e);
            };
          }),
          (e.getEndomorphismMonoid = function () {
            return {
              concat: function (t, e) {
                return i(t, e);
              },
              empty: n,
            };
          });
      },
      670: function (t, e) {
        'use strict';
        var n =
          (this && this.__spreadArray) ||
          function (t, e) {
            for (var n = 0, r = e.length, i = t.length; n < r; n++, i++)
              t[i] = e[n];
            return t;
          };
        Object.defineProperty(e, '__esModule', { value: !0 }),
          (e.fromReadonlyNonEmptyArray =
            e.has =
            e.emptyRecord =
            e.emptyReadonlyArray =
            e.tail =
            e.head =
            e.isNonEmpty =
            e.singleton =
            e.right =
            e.left =
            e.isRight =
            e.isLeft =
            e.some =
            e.none =
            e.isSome =
            e.isNone =
              void 0),
          (e.isNone = function (t) {
            return 'None' === t._tag;
          }),
          (e.isSome = function (t) {
            return 'Some' === t._tag;
          }),
          (e.none = { _tag: 'None' }),
          (e.some = function (t) {
            return { _tag: 'Some', value: t };
          }),
          (e.isLeft = function (t) {
            return 'Left' === t._tag;
          }),
          (e.isRight = function (t) {
            return 'Right' === t._tag;
          }),
          (e.left = function (t) {
            return { _tag: 'Left', left: t };
          }),
          (e.right = function (t) {
            return { _tag: 'Right', right: t };
          }),
          (e.singleton = function (t) {
            return [t];
          }),
          (e.isNonEmpty = function (t) {
            return t.length > 0;
          }),
          (e.head = function (t) {
            return t[0];
          }),
          (e.tail = function (t) {
            return t.slice(1);
          }),
          (e.emptyReadonlyArray = []),
          (e.emptyRecord = {}),
          (e.has = Object.prototype.hasOwnProperty),
          (e.fromReadonlyNonEmptyArray = function (t) {
            return n([t[0]], t.slice(1));
          });
      },
      833: (t, e, n) => {
        'use strict';
        e.Rn = void 0;
        var r = n(188),
          i = n(71);
        function o(t) {
          return void 0 !== t.message
            ? t.message
            : 'Invalid value ' +
                ('function' == typeof (e = t.value)
                  ? r.getFunctionName(e)
                  : 'number' != typeof e || isFinite(e)
                  ? JSON.stringify(e)
                  : isNaN(e)
                  ? 'NaN'
                  : e > 0
                  ? 'Infinity'
                  : '-Infinity') +
                ' supplied to ' +
                t.context
                  .map(function (t) {
                    return t.key + ': ' + t.type.name;
                  })
                  .join('/');
          var e;
        }
        function s(t) {
          return t.map(o);
        }
        (e.Rn = s),
          i.fold(s, function () {
            return ['No errors!'];
          });
      },
      188: function (t, e, n) {
        'use strict';
        var r,
          i =
            (this && this.__extends) ||
            ((r = function (t, e) {
              return (
                (r =
                  Object.setPrototypeOf ||
                  ({ __proto__: [] } instanceof Array &&
                    function (t, e) {
                      t.__proto__ = e;
                    }) ||
                  function (t, e) {
                    for (var n in e)
                      Object.prototype.hasOwnProperty.call(e, n) &&
                        (t[n] = e[n]);
                  }),
                r(t, e)
              );
            }),
            function (t, e) {
              function n() {
                this.constructor = t;
              }
              r(t, e),
                (t.prototype =
                  null === e
                    ? Object.create(e)
                    : ((n.prototype = e.prototype), new n()));
            }),
          o =
            (this && this.__assign) ||
            function () {
              return (
                (o =
                  Object.assign ||
                  function (t) {
                    for (var e, n = 1, r = arguments.length; n < r; n++)
                      for (var i in (e = arguments[n]))
                        Object.prototype.hasOwnProperty.call(e, i) &&
                          (t[i] = e[i]);
                    return t;
                  }),
                o.apply(this, arguments)
              );
            },
          s =
            (this && this.__spreadArrays) ||
            function () {
              for (var t = 0, e = 0, n = arguments.length; e < n; e++)
                t += arguments[e].length;
              var r = Array(t),
                i = 0;
              for (e = 0; e < n; e++)
                for (var o = arguments[e], s = 0, a = o.length; s < a; s++, i++)
                  r[i] = o[s];
              return r;
            };
        Object.defineProperty(e, '__esModule', { value: !0 }),
          (e.partial =
            e.PartialType =
            e.type =
            e.InterfaceType =
            e.array =
            e.ArrayType =
            e.recursion =
            e.RecursiveType =
            e.Int =
            e.brand =
            e.RefinementType =
            e.keyof =
            e.KeyofType =
            e.literal =
            e.LiteralType =
            e.void =
            e.undefined =
            e.null =
            e.UnknownRecord =
            e.AnyDictionaryType =
            e.UnknownArray =
            e.AnyArrayType =
            e.boolean =
            e.BooleanType =
            e.bigint =
            e.BigIntType =
            e.number =
            e.NumberType =
            e.string =
            e.StringType =
            e.unknown =
            e.UnknownType =
            e.voidType =
            e.VoidType =
            e.UndefinedType =
            e.nullType =
            e.NullType =
            e.getIndex =
            e.getTags =
            e.emptyTags =
            e.mergeAll =
            e.getDomainKeys =
            e.appendContext =
            e.getContextEntry =
            e.getFunctionName =
            e.identity =
            e.Type =
            e.success =
            e.failure =
            e.failures =
              void 0),
          (e.alias =
            e.clean =
            e.StrictType =
            e.dictionary =
            e.Integer =
            e.refinement =
            e.object =
            e.ObjectType =
            e.Dictionary =
            e.any =
            e.AnyType =
            e.never =
            e.NeverType =
            e.getDefaultContext =
            e.getValidationError =
            e.interface =
            e.Array =
            e.taggedUnion =
            e.TaggedUnionType =
            e.Function =
            e.FunctionType =
            e.exact =
            e.ExactType =
            e.strict =
            e.readonlyArray =
            e.ReadonlyArrayType =
            e.readonly =
            e.ReadonlyType =
            e.tuple =
            e.TupleType =
            e.intersection =
            e.IntersectionType =
            e.union =
            e.UnionType =
            e.record =
            e.DictionaryType =
              void 0);
        var a = n(71);
        (e.failures = a.left),
          (e.failure = function (t, n, r) {
            return e.failures([{ value: t, context: n, message: r }]);
          }),
          (e.success = a.right);
        var c = (function () {
          function t(t, e, n, r) {
            (this.name = t),
              (this.is = e),
              (this.validate = n),
              (this.encode = r),
              (this.decode = this.decode.bind(this));
          }
          return (
            (t.prototype.pipe = function (n, r) {
              var i = this;
              return (
                void 0 === r && (r = 'pipe(' + this.name + ', ' + n.name + ')'),
                new t(
                  r,
                  n.is,
                  function (t, e) {
                    var r = i.validate(t, e);
                    return a.isLeft(r) ? r : n.validate(r.right, e);
                  },
                  this.encode === e.identity && n.encode === e.identity
                    ? e.identity
                    : function (t) {
                        return i.encode(n.encode(t));
                      }
                )
              );
            }),
            (t.prototype.asDecoder = function () {
              return this;
            }),
            (t.prototype.asEncoder = function () {
              return this;
            }),
            (t.prototype.decode = function (t) {
              return this.validate(t, [{ key: '', type: this, actual: t }]);
            }),
            t
          );
        })();
        function u(t) {
          return t.displayName || t.name || '<function' + t.length + '>';
        }
        function l(t, e, n, r) {
          for (var i = t.length, o = Array(i + 1), s = 0; s < i; s++)
            o[s] = t[s];
          return (o[i] = { key: e, type: n, actual: r }), o;
        }
        function f(t, e) {
          for (var n = e.length, r = 0; r < n; r++) t.push(e[r]);
        }
        (e.Type = c),
          (e.identity = function (t) {
            return t;
          }),
          (e.getFunctionName = u),
          (e.getContextEntry = function (t, e) {
            return { key: t, type: e };
          }),
          (e.appendContext = l);
        var h = Object.prototype.hasOwnProperty;
        function p(t) {
          return Object.keys(t)
            .map(function (e) {
              return e + ': ' + t[e].name;
            })
            .join(', ');
        }
        function d(t) {
          for (var n = 0; n < t.length; n++)
            if (t[n].encode !== e.identity) return !1;
          return !0;
        }
        function g(t) {
          return '{ ' + p(t) + ' }';
        }
        function m(t) {
          return 'Partial<' + t + '>';
        }
        function y(t) {
          var n;
          if (j(t)) {
            var r = t.value;
            if (e.string.is(r)) return ((n = {})[r] = null), n;
          } else {
            if ('KeyofType' === t._tag) return t.keys;
            if (E(t)) {
              var i = t.types.map(function (t) {
                return y(t);
              });
              return i.some(I.is)
                ? void 0
                : Object.assign.apply(Object, s([{}], i));
            }
          }
        }
        function v(t) {
          return (
            '(' +
            t
              .map(function (t) {
                return t.name;
              })
              .join(' | ') +
            ')'
          );
        }
        function b(t, n) {
          for (
            var r = !0, i = !0, o = !e.UnknownRecord.is(t), s = 0, a = n;
            s < a.length;
            s++
          )
            (f = a[s]) !== t && (r = !1), e.UnknownRecord.is(f) && (i = !1);
          if (r) return t;
          if (i) return n[n.length - 1];
          for (var c = {}, u = 0, l = n; u < l.length; u++) {
            var f = l[u];
            for (var h in f)
              (c.hasOwnProperty(h) && !o && f[h] === t[h]) || (c[h] = f[h]);
          }
          return c;
        }
        function w(t) {
          switch (t._tag) {
            case 'RefinementType':
            case 'ReadonlyType':
              return w(t.type);
            case 'InterfaceType':
            case 'StrictType':
            case 'PartialType':
              return t.props;
            case 'IntersectionType':
              return t.types.reduce(function (t, e) {
                return Object.assign(t, w(e));
              }, {});
          }
        }
        function O(t, e) {
          for (
            var n = Object.getOwnPropertyNames(t), r = !1, i = {}, o = 0;
            o < n.length;
            o++
          ) {
            var s = n[o];
            h.call(e, s) ? (i[s] = t[s]) : (r = !0);
          }
          return r ? i : t;
        }
        function _(t, e) {
          for (var n = [], r = 0, i = t; r < i.length; r++) {
            var o = i[r];
            -1 !== e.indexOf(o) && n.push(o);
          }
          return n;
        }
        function C(t) {
          return 'AnyType' === t._tag;
        }
        function j(t) {
          return 'LiteralType' === t._tag;
        }
        function A(t) {
          return 'InterfaceType' === t._tag;
        }
        function E(t) {
          return 'UnionType' === t._tag;
        }
        (e.getDomainKeys = y), (e.mergeAll = b), (e.emptyTags = {});
        var k = [];
        function x(t) {
          if (-1 !== k.indexOf(t)) return e.emptyTags;
          if (
            A(t) ||
            (function (t) {
              return 'StrictType' === t._tag;
            })(t)
          ) {
            var n = e.emptyTags;
            for (var r in t.props) {
              var i = t.props[r];
              j(i) && (n === e.emptyTags && (n = {}), (n[r] = [i.value]));
            }
            return n;
          }
          if (
            (function (t) {
              return 'ExactType' === t._tag;
            })(t) ||
            (function (t) {
              return 'RefinementType' === t._tag;
            })(t)
          )
            return x(t.type);
          if (
            (function (t) {
              return 'IntersectionType' === t._tag;
            })(t)
          )
            return t.types.reduce(function (t, n) {
              return (function (t, n) {
                if (t === e.emptyTags) return n;
                if (n === e.emptyTags) return t;
                var r = Object.assign({}, t);
                for (var i in n)
                  if (t.hasOwnProperty(i)) {
                    var o = _(t[i], n[i]);
                    if (!(o.length > 0)) {
                      r = e.emptyTags;
                      break;
                    }
                    r[i] = o;
                  } else r[i] = n[i];
                return r;
              })(t, x(n));
            }, e.emptyTags);
          if (E(t))
            return t.types.slice(1).reduce(function (t, n) {
              return (function (t, n) {
                if (t === e.emptyTags || n === e.emptyTags) return e.emptyTags;
                var r = e.emptyTags;
                for (var i in t)
                  n.hasOwnProperty(i) &&
                    0 === _(t[i], n[i]).length &&
                    (r === e.emptyTags && (r = {}), (r[i] = t[i].concat(n[i])));
                return r;
              })(t, x(n));
            }, x(t.types[0]));
          if (
            (function (t) {
              return 'RecursiveType' === t._tag;
            })(t)
          ) {
            k.push(t);
            var o = x(t.type);
            return k.pop(), o;
          }
          return e.emptyTags;
        }
        function S(t) {
          for (
            var e = x(t[0]),
              n = Object.keys(e),
              r = t.length,
              i = function (n) {
                for (var i = e[n].slice(), o = [e[n]], s = 1; s < r; s++) {
                  var a = x(t[s])[n];
                  if (void 0 === a) return 'continue-keys';
                  if (
                    a.some(function (t) {
                      return -1 !== i.indexOf(t);
                    })
                  )
                    return 'continue-keys';
                  i.push.apply(i, a), o.push(a);
                }
                return { value: [n, o] };
              },
              o = 0,
              s = n;
            o < s.length;
            o++
          ) {
            var a = i(s[o]);
            if ('object' == typeof a) return a.value;
          }
        }
        (e.getTags = x), (e.getIndex = S);
        var T = (function (t) {
          function n() {
            var n =
              t.call(
                this,
                'null',
                function (t) {
                  return null === t;
                },
                function (t, r) {
                  return n.is(t) ? e.success(t) : e.failure(t, r);
                },
                e.identity
              ) || this;
            return (n._tag = 'NullType'), n;
          }
          return i(n, t), n;
        })(c);
        (e.NullType = T), (e.nullType = new T()), (e.null = e.nullType);
        var M = (function (t) {
          function n() {
            var n =
              t.call(
                this,
                'undefined',
                function (t) {
                  return void 0 === t;
                },
                function (t, r) {
                  return n.is(t) ? e.success(t) : e.failure(t, r);
                },
                e.identity
              ) || this;
            return (n._tag = 'UndefinedType'), n;
          }
          return i(n, t), n;
        })(c);
        e.UndefinedType = M;
        var I = new M();
        e.undefined = I;
        var R = (function (t) {
          function n() {
            var n = t.call(this, 'void', I.is, I.validate, e.identity) || this;
            return (n._tag = 'VoidType'), n;
          }
          return i(n, t), n;
        })(c);
        (e.VoidType = R), (e.voidType = new R()), (e.void = e.voidType);
        var F = (function (t) {
          function n() {
            var n =
              t.call(
                this,
                'unknown',
                function (t) {
                  return !0;
                },
                e.success,
                e.identity
              ) || this;
            return (n._tag = 'UnknownType'), n;
          }
          return i(n, t), n;
        })(c);
        (e.UnknownType = F), (e.unknown = new F());
        var P = (function (t) {
          function n() {
            var n =
              t.call(
                this,
                'string',
                function (t) {
                  return 'string' == typeof t;
                },
                function (t, r) {
                  return n.is(t) ? e.success(t) : e.failure(t, r);
                },
                e.identity
              ) || this;
            return (n._tag = 'StringType'), n;
          }
          return i(n, t), n;
        })(c);
        (e.StringType = P), (e.string = new P());
        var L = (function (t) {
          function n() {
            var n =
              t.call(
                this,
                'number',
                function (t) {
                  return 'number' == typeof t;
                },
                function (t, r) {
                  return n.is(t) ? e.success(t) : e.failure(t, r);
                },
                e.identity
              ) || this;
            return (n._tag = 'NumberType'), n;
          }
          return i(n, t), n;
        })(c);
        (e.NumberType = L), (e.number = new L());
        var N = (function (t) {
          function n() {
            var n =
              t.call(
                this,
                'bigint',
                function (t) {
                  return 'bigint' == typeof t;
                },
                function (t, r) {
                  return n.is(t) ? e.success(t) : e.failure(t, r);
                },
                e.identity
              ) || this;
            return (n._tag = 'BigIntType'), n;
          }
          return i(n, t), n;
        })(c);
        (e.BigIntType = N), (e.bigint = new N());
        var U = (function (t) {
          function n() {
            var n =
              t.call(
                this,
                'boolean',
                function (t) {
                  return 'boolean' == typeof t;
                },
                function (t, r) {
                  return n.is(t) ? e.success(t) : e.failure(t, r);
                },
                e.identity
              ) || this;
            return (n._tag = 'BooleanType'), n;
          }
          return i(n, t), n;
        })(c);
        (e.BooleanType = U), (e.boolean = new U());
        var $ = (function (t) {
          function n() {
            var n =
              t.call(
                this,
                'UnknownArray',
                Array.isArray,
                function (t, r) {
                  return n.is(t) ? e.success(t) : e.failure(t, r);
                },
                e.identity
              ) || this;
            return (n._tag = 'AnyArrayType'), n;
          }
          return i(n, t), n;
        })(c);
        (e.AnyArrayType = $),
          (e.UnknownArray = new $()),
          (e.Array = e.UnknownArray);
        var W = (function (t) {
          function n() {
            var n =
              t.call(
                this,
                'UnknownRecord',
                function (t) {
                  var e = Object.prototype.toString.call(t);
                  return '[object Object]' === e || '[object Window]' === e;
                },
                function (t, r) {
                  return n.is(t) ? e.success(t) : e.failure(t, r);
                },
                e.identity
              ) || this;
            return (n._tag = 'AnyDictionaryType'), n;
          }
          return i(n, t), n;
        })(c);
        (e.AnyDictionaryType = W), (e.UnknownRecord = new W());
        var D = (function (t) {
          function e(e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.value = o), (s._tag = 'LiteralType'), s;
          }
          return i(e, t), e;
        })(c);
        (e.LiteralType = D),
          (e.literal = function (t, n) {
            void 0 === n && (n = JSON.stringify(t));
            var r = function (e) {
              return e === t;
            };
            return new D(
              n,
              r,
              function (n, i) {
                return r(n) ? e.success(t) : e.failure(n, i);
              },
              e.identity,
              t
            );
          });
        var z = (function (t) {
          function e(e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.keys = o), (s._tag = 'KeyofType'), s;
          }
          return i(e, t), e;
        })(c);
        (e.KeyofType = z),
          (e.keyof = function (t, n) {
            void 0 === n &&
              (n = Object.keys(t)
                .map(function (t) {
                  return JSON.stringify(t);
                })
                .join(' | '));
            var r = function (n) {
              return e.string.is(n) && h.call(t, n);
            };
            return new z(
              n,
              r,
              function (t, n) {
                return r(t) ? e.success(t) : e.failure(t, n);
              },
              e.identity,
              t
            );
          });
        var q = (function (t) {
          function e(e, n, r, i, o, s) {
            var a = t.call(this, e, n, r, i) || this;
            return (
              (a.type = o), (a.predicate = s), (a._tag = 'RefinementType'), a
            );
          }
          return i(e, t), e;
        })(c);
        function B(t, e, n) {
          return ht(t, e, n);
        }
        (e.RefinementType = q),
          (e.brand = B),
          (e.Int = B(
            e.number,
            function (t) {
              return Number.isInteger(t);
            },
            'Int'
          ));
        var V = (function (t) {
          function e(e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.runDefinition = o), (s._tag = 'RecursiveType'), s;
          }
          return i(e, t), e;
        })(c);
        (e.RecursiveType = V),
          Object.defineProperty(V.prototype, 'type', {
            get: function () {
              return this.runDefinition();
            },
            enumerable: !0,
            configurable: !0,
          }),
          (e.recursion = function (t, e) {
            var n,
              r = function () {
                return n || ((n = e(i)).name = t), n;
              },
              i = new V(
                t,
                function (t) {
                  return r().is(t);
                },
                function (t, e) {
                  return r().validate(t, e);
                },
                function (t) {
                  return r().encode(t);
                },
                r
              );
            return i;
          });
        var H = (function (t) {
          function e(e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.type = o), (s._tag = 'ArrayType'), s;
          }
          return i(e, t), e;
        })(c);
        function K(t, n) {
          return (
            void 0 === n && (n = 'Array<' + t.name + '>'),
            new H(
              n,
              function (n) {
                return e.UnknownArray.is(n) && n.every(t.is);
              },
              function (n, r) {
                var i = e.UnknownArray.validate(n, r);
                if (a.isLeft(i)) return i;
                for (
                  var o = i.right, s = o.length, c = o, u = [], h = 0;
                  h < s;
                  h++
                ) {
                  var p = o[h],
                    d = t.validate(p, l(r, String(h), t, p));
                  if (a.isLeft(d)) f(u, d.left);
                  else {
                    var g = d.right;
                    g !== p && (c === o && (c = o.slice()), (c[h] = g));
                  }
                }
                return u.length > 0 ? e.failures(u) : e.success(c);
              },
              t.encode === e.identity
                ? e.identity
                : function (e) {
                    return e.map(t.encode);
                  },
              t
            )
          );
        }
        (e.ArrayType = H), (e.array = K);
        var G = (function (t) {
          function e(e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.props = o), (s._tag = 'InterfaceType'), s;
          }
          return i(e, t), e;
        })(c);
        function J(t, n) {
          void 0 === n && (n = g(t));
          var r = Object.keys(t),
            i = r.map(function (e) {
              return t[e];
            }),
            s = r.length;
          return new G(
            n,
            function (t) {
              if (e.UnknownRecord.is(t)) {
                for (var n = 0; n < s; n++) {
                  var o = r[n],
                    a = t[o];
                  if ((void 0 === a && !h.call(t, o)) || !i[n].is(a)) return !1;
                }
                return !0;
              }
              return !1;
            },
            function (t, n) {
              var c = e.UnknownRecord.validate(t, n);
              if (a.isLeft(c)) return c;
              for (var u = c.right, p = u, d = [], g = 0; g < s; g++) {
                var m = r[g],
                  y = p[m],
                  v = i[g],
                  b = v.validate(y, l(n, m, v, y));
                if (a.isLeft(b)) f(d, b.left);
                else {
                  var w = b.right;
                  (w !== y || (void 0 === w && !h.call(p, m))) &&
                    (p === u && (p = o({}, u)), (p[m] = w));
                }
              }
              return d.length > 0 ? e.failures(d) : e.success(p);
            },
            d(i)
              ? e.identity
              : function (t) {
                  for (var n = o({}, t), a = 0; a < s; a++) {
                    var c = r[a],
                      u = i[a].encode;
                    u !== e.identity && (n[c] = u(t[c]));
                  }
                  return n;
                },
            t
          );
        }
        (e.InterfaceType = G), (e.type = J), (e.interface = J);
        var Y = (function (t) {
          function e(e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.props = o), (s._tag = 'PartialType'), s;
          }
          return i(e, t), e;
        })(c);
        (e.PartialType = Y),
          (e.partial = function (t, n) {
            void 0 === n && (n = m(g(t)));
            var r = Object.keys(t),
              i = r.map(function (e) {
                return t[e];
              }),
              s = r.length;
            return new Y(
              n,
              function (n) {
                if (e.UnknownRecord.is(n)) {
                  for (var i = 0; i < s; i++) {
                    var o = r[i],
                      a = n[o];
                    if (void 0 !== a && !t[o].is(a)) return !1;
                  }
                  return !0;
                }
                return !1;
              },
              function (n, i) {
                var c = e.UnknownRecord.validate(n, i);
                if (a.isLeft(c)) return c;
                for (var u = c.right, h = u, p = [], d = 0; d < s; d++) {
                  var g = r[d],
                    m = h[g],
                    y = t[g],
                    v = y.validate(m, l(i, g, y, m));
                  if (a.isLeft(v)) void 0 !== m && f(p, v.left);
                  else {
                    var b = v.right;
                    b !== m && (h === u && (h = o({}, u)), (h[g] = b));
                  }
                }
                return p.length > 0 ? e.failures(p) : e.success(h);
              },
              d(i)
                ? e.identity
                : function (t) {
                    for (var e = o({}, t), n = 0; n < s; n++) {
                      var a = r[n],
                        c = t[a];
                      void 0 !== c && (e[a] = i[n].encode(c));
                    }
                    return e;
                  },
              t
            );
          });
        var Q = (function (t) {
          function e(e, n, r, i, o, s) {
            var a = t.call(this, e, n, r, i) || this;
            return (
              (a.domain = o), (a.codomain = s), (a._tag = 'DictionaryType'), a
            );
          }
          return i(e, t), e;
        })(c);
        function Z(t, n, r) {
          var i = y(t);
          return i
            ? (function (t, n, r, i) {
                void 0 === i &&
                  (i = '{ [K in ' + n.name + ']: ' + r.name + ' }');
                var o = t.length;
                return new Q(
                  i,
                  function (n) {
                    return (
                      e.UnknownRecord.is(n) &&
                      t.every(function (t) {
                        return r.is(n[t]);
                      })
                    );
                  },
                  function (n, i) {
                    var s = e.UnknownRecord.validate(n, i);
                    if (a.isLeft(s)) return s;
                    for (
                      var c = s.right, u = {}, h = [], p = !1, d = 0;
                      d < o;
                      d++
                    ) {
                      var g = t[d],
                        m = c[g],
                        y = r.validate(m, l(i, g, r, m));
                      if (a.isLeft(y)) f(h, y.left);
                      else {
                        var v = y.right;
                        (p = p || v !== m), (u[g] = v);
                      }
                    }
                    return h.length > 0
                      ? e.failures(h)
                      : e.success(p || Object.keys(c).length !== o ? u : c);
                  },
                  r.encode === e.identity
                    ? e.identity
                    : function (e) {
                        for (var n = {}, i = 0; i < o; i++) {
                          var s = t[i];
                          n[s] = r.encode(e[s]);
                        }
                        return n;
                      },
                  n,
                  r
                );
              })(Object.keys(i), t, n, r)
            : (function (t, n, r) {
                return (
                  void 0 === r &&
                    (r = '{ [K in ' + t.name + ']: ' + n.name + ' }'),
                  new Q(
                    r,
                    function (r) {
                      return e.UnknownRecord.is(r)
                        ? Object.keys(r).every(function (e) {
                            return t.is(e) && n.is(r[e]);
                          })
                        : C(n) && Array.isArray(r);
                    },
                    function (r, i) {
                      if (e.UnknownRecord.is(r)) {
                        for (
                          var o = {},
                            s = [],
                            c = Object.keys(r),
                            u = c.length,
                            h = !1,
                            p = 0;
                          p < u;
                          p++
                        ) {
                          var d = c[p],
                            g = r[d],
                            m = t.validate(d, l(i, d, t, d));
                          if (a.isLeft(m)) f(s, m.left);
                          else {
                            var y = m.right;
                            (h = h || y !== d), (d = y);
                            var v = n.validate(g, l(i, d, n, g));
                            if (a.isLeft(v)) f(s, v.left);
                            else {
                              var b = v.right;
                              (h = h || b !== g), (o[d] = b);
                            }
                          }
                        }
                        return s.length > 0
                          ? e.failures(s)
                          : e.success(h ? o : r);
                      }
                      return C(n) && Array.isArray(r)
                        ? e.success(r)
                        : e.failure(r, i);
                    },
                    t.encode === e.identity && n.encode === e.identity
                      ? e.identity
                      : function (e) {
                          for (
                            var r = {}, i = Object.keys(e), o = i.length, s = 0;
                            s < o;
                            s++
                          ) {
                            var a = i[s];
                            r[String(t.encode(a))] = n.encode(e[a]);
                          }
                          return r;
                        },
                    t,
                    n
                  )
                );
              })(t, n, r);
        }
        (e.DictionaryType = Q), (e.record = Z);
        var X = (function (t) {
          function e(e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.types = o), (s._tag = 'UnionType'), s;
          }
          return i(e, t), e;
        })(c);
        function tt(t, n) {
          void 0 === n && (n = v(t));
          var r = S(t);
          if (void 0 !== r && t.length > 0) {
            var i = r[0],
              o = r[1],
              s = o.length,
              c = function (t) {
                for (var e = 0; e < s; e++)
                  if (-1 !== o[e].indexOf(t)) return e;
              };
            return new ct(
              n,
              function (n) {
                if (e.UnknownRecord.is(n)) {
                  var r = c(n[i]);
                  return void 0 !== r && t[r].is(n);
                }
                return !1;
              },
              function (n, r) {
                var o = e.UnknownRecord.validate(n, r);
                if (a.isLeft(o)) return o;
                var s = o.right,
                  u = c(s[i]);
                if (void 0 === u) return e.failure(n, r);
                var f = t[u];
                return f.validate(s, l(r, String(u), f, s));
              },
              d(t)
                ? e.identity
                : function (e) {
                    var r = c(e[i]);
                    if (void 0 === r)
                      throw new Error(
                        'no codec found to encode value in union codec ' + n
                      );
                    return t[r].encode(e);
                  },
              t,
              i
            );
          }
          return new X(
            n,
            function (e) {
              return t.some(function (t) {
                return t.is(e);
              });
            },
            function (n, r) {
              for (var i = [], o = 0; o < t.length; o++) {
                var s = t[o],
                  c = s.validate(n, l(r, String(o), s, n));
                if (!a.isLeft(c)) return e.success(c.right);
                f(i, c.left);
              }
              return e.failures(i);
            },
            d(t)
              ? e.identity
              : function (e) {
                  for (var r = 0, i = t; r < i.length; r++) {
                    var o = i[r];
                    if (o.is(e)) return o.encode(e);
                  }
                  throw new Error(
                    'no codec found to encode value in union type ' + n
                  );
                },
            t
          );
        }
        (e.UnionType = X), (e.union = tt);
        var et = (function (t) {
          function e(e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.types = o), (s._tag = 'IntersectionType'), s;
          }
          return i(e, t), e;
        })(c);
        (e.IntersectionType = et),
          (e.intersection = function (t, n) {
            void 0 === n &&
              (n =
                '(' +
                t
                  .map(function (t) {
                    return t.name;
                  })
                  .join(' & ') +
                ')');
            var r = t.length;
            return new et(
              n,
              function (e) {
                return t.every(function (t) {
                  return t.is(e);
                });
              },
              0 === t.length
                ? e.success
                : function (n, i) {
                    for (var o = [], s = [], c = 0; c < r; c++) {
                      var u = t[c],
                        h = u.validate(n, l(i, String(c), u, n));
                      a.isLeft(h) ? f(s, h.left) : o.push(h.right);
                    }
                    return s.length > 0 ? e.failures(s) : e.success(b(n, o));
                  },
              0 === t.length
                ? e.identity
                : function (e) {
                    return b(
                      e,
                      t.map(function (t) {
                        return t.encode(e);
                      })
                    );
                  },
              t
            );
          });
        var nt = (function (t) {
          function e(e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.types = o), (s._tag = 'TupleType'), s;
          }
          return i(e, t), e;
        })(c);
        (e.TupleType = nt),
          (e.tuple = function (t, n) {
            void 0 === n &&
              (n =
                '[' +
                t
                  .map(function (t) {
                    return t.name;
                  })
                  .join(', ') +
                ']');
            var r = t.length;
            return new nt(
              n,
              function (n) {
                return (
                  e.UnknownArray.is(n) &&
                  n.length === r &&
                  t.every(function (t, e) {
                    return t.is(n[e]);
                  })
                );
              },
              function (n, i) {
                var o = e.UnknownArray.validate(n, i);
                if (a.isLeft(o)) return o;
                for (
                  var s = o.right,
                    c = s.length > r ? s.slice(0, r) : s,
                    u = [],
                    h = 0;
                  h < r;
                  h++
                ) {
                  var p = s[h],
                    d = t[h],
                    g = d.validate(p, l(i, String(h), d, p));
                  if (a.isLeft(g)) f(u, g.left);
                  else {
                    var m = g.right;
                    m !== p && (c === s && (c = s.slice()), (c[h] = m));
                  }
                }
                return u.length > 0 ? e.failures(u) : e.success(c);
              },
              d(t)
                ? e.identity
                : function (e) {
                    return t.map(function (t, n) {
                      return t.encode(e[n]);
                    });
                  },
              t
            );
          });
        var rt = (function (t) {
          function e(e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.type = o), (s._tag = 'ReadonlyType'), s;
          }
          return i(e, t), e;
        })(c);
        (e.ReadonlyType = rt),
          (e.readonly = function (t, e) {
            return (
              void 0 === e && (e = 'Readonly<' + t.name + '>'),
              new rt(e, t.is, t.validate, t.encode, t)
            );
          });
        var it = (function (t) {
          function e(e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.type = o), (s._tag = 'ReadonlyArrayType'), s;
          }
          return i(e, t), e;
        })(c);
        (e.ReadonlyArrayType = it),
          (e.readonlyArray = function (t, e) {
            void 0 === e && (e = 'ReadonlyArray<' + t.name + '>');
            var n = K(t);
            return new it(e, n.is, n.validate, n.encode, t);
          }),
          (e.strict = function (t, e) {
            return st(J(t), e);
          });
        var ot = (function (t) {
          function e(e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.type = o), (s._tag = 'ExactType'), s;
          }
          return i(e, t), e;
        })(c);
        function st(t, n) {
          void 0 === n &&
            (n = (function (t) {
              return A(t)
                ? '{| ' + p(t.props) + ' |}'
                : (function (t) {
                    return 'PartialType' === t._tag;
                  })(t)
                ? m('{| ' + p(t.props) + ' |}')
                : 'Exact<' + t.name + '>';
            })(t));
          var r = w(t);
          return new ot(
            n,
            t.is,
            function (n, i) {
              var o = e.UnknownRecord.validate(n, i);
              if (a.isLeft(o)) return o;
              var s = t.validate(n, i);
              return a.isLeft(s) ? s : a.right(O(s.right, r));
            },
            function (e) {
              return t.encode(O(e, r));
            },
            t
          );
        }
        (e.ExactType = ot), (e.exact = st);
        var at = (function (t) {
          function n() {
            var n =
              t.call(
                this,
                'Function',
                function (t) {
                  return 'function' == typeof t;
                },
                function (t, r) {
                  return n.is(t) ? e.success(t) : e.failure(t, r);
                },
                e.identity
              ) || this;
            return (n._tag = 'FunctionType'), n;
          }
          return i(n, t), n;
        })(c);
        (e.FunctionType = at), (e.Function = new at());
        var ct = (function (t) {
          function e(e, n, r, i, o, s) {
            var a = t.call(this, e, n, r, i, o) || this;
            return (a.tag = s), a;
          }
          return i(e, t), e;
        })(X);
        (e.TaggedUnionType = ct),
          (e.taggedUnion = function (t, e, n) {
            void 0 === n && (n = v(e));
            var r = tt(e, n);
            return r instanceof ct
              ? r
              : (console.warn(
                  '[io-ts] Cannot build a tagged union for ' +
                    n +
                    ', returning a de-optimized union'
                ),
                new ct(n, r.is, r.validate, r.encode, e, t));
          }),
          (e.getValidationError = function (t, e) {
            return { value: t, context: e };
          }),
          (e.getDefaultContext = function (t) {
            return [{ key: '', type: t }];
          });
        var ut = (function (t) {
          function n() {
            var n =
              t.call(
                this,
                'never',
                function (t) {
                  return !1;
                },
                function (t, n) {
                  return e.failure(t, n);
                },
                function () {
                  throw new Error('cannot encode never');
                }
              ) || this;
            return (n._tag = 'NeverType'), n;
          }
          return i(n, t), n;
        })(c);
        (e.NeverType = ut), (e.never = new ut());
        var lt = (function (t) {
          function n() {
            var n =
              t.call(
                this,
                'any',
                function (t) {
                  return !0;
                },
                e.success,
                e.identity
              ) || this;
            return (n._tag = 'AnyType'), n;
          }
          return i(n, t), n;
        })(c);
        (e.AnyType = lt), (e.any = new lt()), (e.Dictionary = e.UnknownRecord);
        var ft = (function (t) {
          function n() {
            var n =
              t.call(
                this,
                'object',
                function (t) {
                  return null !== t && 'object' == typeof t;
                },
                function (t, r) {
                  return n.is(t) ? e.success(t) : e.failure(t, r);
                },
                e.identity
              ) || this;
            return (n._tag = 'ObjectType'), n;
          }
          return i(n, t), n;
        })(c);
        function ht(t, n, r) {
          return (
            void 0 === r && (r = '(' + t.name + ' | ' + u(n) + ')'),
            new q(
              r,
              function (e) {
                return t.is(e) && n(e);
              },
              function (r, i) {
                var o = t.validate(r, i);
                if (a.isLeft(o)) return o;
                var s = o.right;
                return n(s) ? e.success(s) : e.failure(s, i);
              },
              t.encode,
              t,
              n
            )
          );
        }
        (e.ObjectType = ft),
          (e.object = new ft()),
          (e.refinement = ht),
          (e.Integer = ht(e.number, Number.isInteger, 'Integer')),
          (e.dictionary = Z);
        var pt = (function (t) {
          function e(e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.props = o), (s._tag = 'StrictType'), s;
          }
          return i(e, t), e;
        })(c);
        (e.StrictType = pt),
          (e.clean = function (t) {
            return t;
          }),
          (e.alias = function (t) {
            return function () {
              return t;
            };
          });
      },
      162: (t, e, n) => {
        'use strict';
        const r = n(37),
          i = n(591),
          o = process.env;
        let s;
        function a(t) {
          const e = (function (t) {
            if (!1 === s) return 0;
            if (i('color=16m') || i('color=full') || i('color=truecolor'))
              return 3;
            if (i('color=256')) return 2;
            if (t && !t.isTTY && !0 !== s) return 0;
            const e = s ? 1 : 0;
            if ('win32' === process.platform) {
              const t = r.release().split('.');
              return Number(process.versions.node.split('.')[0]) >= 8 &&
                Number(t[0]) >= 10 &&
                Number(t[2]) >= 10586
                ? Number(t[2]) >= 14931
                  ? 3
                  : 2
                : 1;
            }
            if ('CI' in o)
              return ['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(
                (t) => t in o
              ) || 'codeship' === o.CI_NAME
                ? 1
                : e;
            if ('TEAMCITY_VERSION' in o)
              return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(o.TEAMCITY_VERSION)
                ? 1
                : 0;
            if ('truecolor' === o.COLORTERM) return 3;
            if ('TERM_PROGRAM' in o) {
              const t = parseInt(
                (o.TERM_PROGRAM_VERSION || '').split('.')[0],
                10
              );
              switch (o.TERM_PROGRAM) {
                case 'iTerm.app':
                  return t >= 3 ? 3 : 2;
                case 'Apple_Terminal':
                  return 2;
              }
            }
            return /-256(color)?$/i.test(o.TERM)
              ? 2
              : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(
                  o.TERM
                ) || 'COLORTERM' in o
              ? 1
              : (o.TERM, e);
          })(t);
          return (function (t) {
            return (
              0 !== t && {
                level: t,
                hasBasic: !0,
                has256: t >= 2,
                has16m: t >= 3,
              }
            );
          })(e);
        }
        i('no-color') || i('no-colors') || i('color=false')
          ? (s = !1)
          : (i('color') ||
              i('colors') ||
              i('color=true') ||
              i('color=always')) &&
            (s = !0),
          'FORCE_COLOR' in o &&
            (s =
              0 === o.FORCE_COLOR.length || 0 !== parseInt(o.FORCE_COLOR, 10)),
          (t.exports = {
            supportsColor: a,
            stdout: a(process.stdout),
            stderr: a(process.stderr),
          });
      },
      591: (t) => {
        'use strict';
        t.exports = (t, e) => {
          e = e || process.argv;
          const n = t.startsWith('-') ? '' : 1 === t.length ? '-' : '--',
            r = e.indexOf(n + t),
            i = e.indexOf('--');
          return -1 !== r && (-1 === i || r < i);
        };
      },
      147: (t) => {
        'use strict';
        t.exports = require('fs');
      },
      37: (t) => {
        'use strict';
        t.exports = require('os');
      },
      17: (t) => {
        'use strict';
        t.exports = require('path');
      },
      224: (t) => {
        'use strict';
        t.exports = require('tty');
      },
      837: (t) => {
        'use strict';
        t.exports = require('util');
      },
    },
    e = {};
  function n(r) {
    var i = e[r];
    if (void 0 !== i) return i.exports;
    var o = (e[r] = { exports: {} });
    return t[r].call(o.exports, o, o.exports, n), o.exports;
  }
  (n.n = (t) => {
    var e = t && t.__esModule ? () => t.default : () => t;
    return n.d(e, { a: e }), e;
  }),
    (n.d = (t, e) => {
      for (var r in e)
        n.o(e, r) &&
          !n.o(t, r) &&
          Object.defineProperty(t, r, { enumerable: !0, get: e[r] });
    }),
    (n.o = (t, e) => Object.prototype.hasOwnProperty.call(t, e)),
    (() => {
      'use strict';
      var t = n(758),
        e = n(71),
        r = n(833),
        i = n(688);
      let o;
      try {
        const { parsed: t } = i.config({ path: '.env' });
        o = t;
      } catch (t) {}
      const s = o;
      Object.prototype.hasOwnProperty;
      var a,
        c = function (t) {
          return { _tag: 'Right', right: t };
        },
        u = function (t) {
          return 'Left' === t._tag;
        },
        l =
          ((a = function (t, e) {
            return (
              (a =
                Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array &&
                  function (t, e) {
                    t.__proto__ = e;
                  }) ||
                function (t, e) {
                  for (var n in e)
                    Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
                }),
              a(t, e)
            );
          }),
          function (t, e) {
            function n() {
              this.constructor = t;
            }
            a(t, e),
              (t.prototype =
                null === e
                  ? Object.create(e)
                  : ((n.prototype = e.prototype), new n()));
          }),
        f = function () {
          return (
            (f =
              Object.assign ||
              function (t) {
                for (var e, n = 1, r = arguments.length; n < r; n++)
                  for (var i in (e = arguments[n]))
                    Object.prototype.hasOwnProperty.call(e, i) && (t[i] = e[i]);
                return t;
              }),
            f.apply(this, arguments)
          );
        },
        h = function (t) {
          return { _tag: 'Left', left: t };
        },
        p = function (t, e, n) {
          return h([{ value: t, context: e, message: n }]);
        },
        d = c,
        g = (function () {
          function t(t, e, n, r) {
            (this.name = t),
              (this.is = e),
              (this.validate = n),
              (this.encode = r),
              (this.decode = this.decode.bind(this));
          }
          return (
            (t.prototype.pipe = function (e, n) {
              var r = this;
              return (
                void 0 === n && (n = 'pipe(' + this.name + ', ' + e.name + ')'),
                new t(
                  n,
                  e.is,
                  function (t, n) {
                    var i = r.validate(t, n);
                    return u(i) ? i : e.validate(i.right, n);
                  },
                  this.encode === m && e.encode === m
                    ? m
                    : function (t) {
                        return r.encode(e.encode(t));
                      }
                )
              );
            }),
            (t.prototype.asDecoder = function () {
              return this;
            }),
            (t.prototype.asEncoder = function () {
              return this;
            }),
            (t.prototype.decode = function (t) {
              return this.validate(t, [{ key: '', type: this, actual: t }]);
            }),
            t
          );
        })(),
        m = function (t) {
          return t;
        };
      function y(t, e, n, r) {
        for (var i = t.length, o = Array(i + 1), s = 0; s < i; s++) o[s] = t[s];
        return (o[i] = { key: e, type: n, actual: r }), o;
      }
      function v(t, e) {
        for (var n = e.length, r = 0; r < n; r++) t.push(e[r]);
      }
      var b = Object.prototype.hasOwnProperty;
      function w(t) {
        return Object.keys(t)
          .map(function (e) {
            return e + ': ' + t[e].name;
          })
          .join(', ');
      }
      function O(t) {
        switch (t._tag) {
          case 'RefinementType':
          case 'ReadonlyType':
            return O(t.type);
          case 'InterfaceType':
          case 'StrictType':
          case 'PartialType':
            return t.props;
          case 'IntersectionType':
            return t.types.reduce(function (t, e) {
              return Object.assign(t, O(e));
            }, {});
        }
      }
      function _(t, e) {
        for (
          var n = Object.getOwnPropertyNames(t), r = !1, i = {}, o = 0;
          o < n.length;
          o++
        ) {
          var s = n[o];
          b.call(e, s) ? (i[s] = t[s]) : (r = !0);
        }
        return r ? i : t;
      }
      new ((function (t) {
        function e() {
          var e =
            t.call(
              this,
              'null',
              function (t) {
                return null === t;
              },
              function (t, n) {
                return e.is(t) ? d(t) : p(t, n);
              },
              m
            ) || this;
          return (e._tag = 'NullType'), e;
        }
        return l(e, t), e;
      })(g))();
      var C,
        j = new ((function (t) {
          function e() {
            var e =
              t.call(
                this,
                'undefined',
                function (t) {
                  return void 0 === t;
                },
                function (t, n) {
                  return e.is(t) ? d(t) : p(t, n);
                },
                m
              ) || this;
            return (e._tag = 'UndefinedType'), e;
          }
          return l(e, t), e;
        })(g))(),
        A =
          (new ((function (t) {
            function e() {
              var e = t.call(this, 'void', j.is, j.validate, m) || this;
              return (e._tag = 'VoidType'), e;
            }
            return l(e, t), e;
          })(g))(),
          new ((function (t) {
            function e() {
              var e =
                t.call(
                  this,
                  'unknown',
                  function (t) {
                    return !0;
                  },
                  d,
                  m
                ) || this;
              return (e._tag = 'UnknownType'), e;
            }
            return l(e, t), e;
          })(g))(),
          new ((function (t) {
            function e() {
              var e =
                t.call(
                  this,
                  'string',
                  function (t) {
                    return 'string' == typeof t;
                  },
                  function (t, n) {
                    return e.is(t) ? d(t) : p(t, n);
                  },
                  m
                ) || this;
              return (e._tag = 'StringType'), e;
            }
            return l(e, t), e;
          })(g))()),
        E = new ((function (t) {
          function e() {
            var e =
              t.call(
                this,
                'number',
                function (t) {
                  return 'number' == typeof t;
                },
                function (t, n) {
                  return e.is(t) ? d(t) : p(t, n);
                },
                m
              ) || this;
            return (e._tag = 'NumberType'), e;
          }
          return l(e, t), e;
        })(g))(),
        k =
          (new ((function (t) {
            function e() {
              var e =
                t.call(
                  this,
                  'bigint',
                  function (t) {
                    return 'bigint' == typeof t;
                  },
                  function (t, n) {
                    return e.is(t) ? d(t) : p(t, n);
                  },
                  m
                ) || this;
              return (e._tag = 'BigIntType'), e;
            }
            return l(e, t), e;
          })(g))(),
          new ((function (t) {
            function e() {
              var e =
                t.call(
                  this,
                  'boolean',
                  function (t) {
                    return 'boolean' == typeof t;
                  },
                  function (t, n) {
                    return e.is(t) ? d(t) : p(t, n);
                  },
                  m
                ) || this;
              return (e._tag = 'BooleanType'), e;
            }
            return l(e, t), e;
          })(g))(),
          new ((function (t) {
            function e() {
              var e =
                t.call(
                  this,
                  'UnknownArray',
                  Array.isArray,
                  function (t, n) {
                    return e.is(t) ? d(t) : p(t, n);
                  },
                  m
                ) || this;
              return (e._tag = 'AnyArrayType'), e;
            }
            return l(e, t), e;
          })(g))(),
          new ((function (t) {
            function e() {
              var e =
                t.call(
                  this,
                  'UnknownRecord',
                  function (t) {
                    var e = Object.prototype.toString.call(t);
                    return '[object Object]' === e || '[object Window]' === e;
                  },
                  function (t, n) {
                    return e.is(t) ? d(t) : p(t, n);
                  },
                  m
                ) || this;
              return (e._tag = 'AnyDictionaryType'), e;
            }
            return l(e, t), e;
          })(g))());
      l(function (t, e, n, r, i) {
        var o = C.call(this, t, e, n, r) || this;
        return (o.value = i), (o._tag = 'LiteralType'), o;
      }, (C = g)),
        (function (t) {
          l(function (e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.keys = o), (s._tag = 'KeyofType'), s;
          }, t);
        })(g);
      var x = (function (t) {
        function e(e, n, r, i, o, s) {
          var a = t.call(this, e, n, r, i) || this;
          return (
            (a.type = o), (a.predicate = s), (a._tag = 'RefinementType'), a
          );
        }
        return l(e, t), e;
      })(g);
      R(
        E,
        function (t) {
          return Number.isInteger(t);
        },
        'Int'
      );
      var S = (function (t) {
        function e(e, n, r, i, o) {
          var s = t.call(this, e, n, r, i) || this;
          return (s.runDefinition = o), (s._tag = 'RecursiveType'), s;
        }
        return l(e, t), e;
      })(g);
      Object.defineProperty(S.prototype, 'type', {
        get: function () {
          return this.runDefinition();
        },
        enumerable: !0,
        configurable: !0,
      }),
        (function (t) {
          l(function (e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.type = o), (s._tag = 'ArrayType'), s;
          }, t);
        })(g);
      var T = (function (t) {
        function e(e, n, r, i, o) {
          var s = t.call(this, e, n, r, i) || this;
          return (s.props = o), (s._tag = 'InterfaceType'), s;
        }
        return l(e, t), e;
      })(g);
      !(function (t) {
        l(function (e, n, r, i, o) {
          var s = t.call(this, e, n, r, i) || this;
          return (s.props = o), (s._tag = 'PartialType'), s;
        }, t);
      })(g),
        (function (t) {
          l(function (e, n, r, i, o, s) {
            var a = t.call(this, e, n, r, i) || this;
            return (
              (a.domain = o), (a.codomain = s), (a._tag = 'DictionaryType'), a
            );
          }, t);
        })(g);
      var M = (function (t) {
        function e(e, n, r, i, o) {
          var s = t.call(this, e, n, r, i) || this;
          return (s.types = o), (s._tag = 'UnionType'), s;
        }
        return l(e, t), e;
      })(g);
      !(function (t) {
        l(function (e, n, r, i, o) {
          var s = t.call(this, e, n, r, i) || this;
          return (s.types = o), (s._tag = 'IntersectionType'), s;
        }, t);
      })(g),
        (function (t) {
          l(function (e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.types = o), (s._tag = 'TupleType'), s;
          }, t);
        })(g),
        (function (t) {
          l(function (e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.type = o), (s._tag = 'ReadonlyType'), s;
          }, t);
        })(g),
        (function (t) {
          l(function (e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.type = o), (s._tag = 'ReadonlyArrayType'), s;
          }, t);
        })(g);
      var I = (function (t) {
        function e(e, n, r, i, o) {
          var s = t.call(this, e, n, r, i) || this;
          return (s.type = o), (s._tag = 'ExactType'), s;
        }
        return l(e, t), e;
      })(g);
      function R(t, e, n) {
        return (
          void 0 === n &&
            (n =
              '(' +
              t.name +
              ' | ' +
              (((r = e).displayName || r.name || '<function' + r.length + '>') +
                ')')),
          new x(
            n,
            function (n) {
              return t.is(n) && e(n);
            },
            function (n, r) {
              var i = t.validate(n, r);
              if (u(i)) return i;
              var o = i.right;
              return e(o) ? d(o) : p(o, r);
            },
            t.encode,
            t,
            e
          )
        );
        var r;
      }
      new ((function (t) {
        function e() {
          var e =
            t.call(
              this,
              'Function',
              function (t) {
                return 'function' == typeof t;
              },
              function (t, n) {
                return e.is(t) ? d(t) : p(t, n);
              },
              m
            ) || this;
          return (e._tag = 'FunctionType'), e;
        }
        return l(e, t), e;
      })(g))(),
        (function (t) {
          l(function (e, n, r, i, o, s) {
            var a = t.call(this, e, n, r, i, o) || this;
            return (a.tag = s), a;
          }, t);
        })(M),
        new ((function (t) {
          function e() {
            var e =
              t.call(
                this,
                'never',
                function (t) {
                  return !1;
                },
                function (t, e) {
                  return p(t, e);
                },
                function () {
                  throw new Error('cannot encode never');
                }
              ) || this;
            return (e._tag = 'NeverType'), e;
          }
          return l(e, t), e;
        })(g))(),
        new ((function (t) {
          function e() {
            var e =
              t.call(
                this,
                'any',
                function (t) {
                  return !0;
                },
                d,
                m
              ) || this;
            return (e._tag = 'AnyType'), e;
          }
          return l(e, t), e;
        })(g))(),
        new ((function (t) {
          function e() {
            var e =
              t.call(
                this,
                'object',
                function (t) {
                  return null !== t && 'object' == typeof t;
                },
                function (t, n) {
                  return e.is(t) ? d(t) : p(t, n);
                },
                m
              ) || this;
            return (e._tag = 'ObjectType'), e;
          }
          return l(e, t), e;
        })(g))(),
        R(E, Number.isInteger, 'Integer'),
        (function (t) {
          l(function (e, n, r, i, o) {
            var s = t.call(this, e, n, r, i) || this;
            return (s.props = o), (s._tag = 'StrictType'), s;
          }, t);
        })(g);
      const F = (function (t, e) {
        void 0 === e &&
          (e = (function (t) {
            return (function (t) {
              return 'InterfaceType' === t._tag;
            })(t)
              ? '{| ' + w(t.props) + ' |}'
              : (function (t) {
                  return 'PartialType' === t._tag;
                })(t)
              ? 'Partial<{| ' + w(t.props) + ' |}>'
              : 'Exact<' + t.name + '>';
          })(t));
        var n = O(t);
        return new I(
          e,
          t.is,
          function (e, r) {
            var i = k.validate(e, r);
            if (u(i)) return i;
            var o = t.validate(e, r);
            return u(o) ? o : c(_(o.right, n));
          },
          function (e) {
            return t.encode(_(e, n));
          },
          t
        );
      })(
        (function (t, e) {
          void 0 === e &&
            (e = (function (t) {
              return '{ ' + w(t) + ' }';
            })(t));
          var n = Object.keys(t),
            r = n.map(function (e) {
              return t[e];
            }),
            i = n.length;
          return new T(
            e,
            function (t) {
              if (k.is(t)) {
                for (var e = 0; e < i; e++) {
                  var o = n[e],
                    s = t[o];
                  if ((void 0 === s && !b.call(t, o)) || !r[e].is(s)) return !1;
                }
                return !0;
              }
              return !1;
            },
            function (t, e) {
              var o = k.validate(t, e);
              if (u(o)) return o;
              for (var s = o.right, a = s, c = [], l = 0; l < i; l++) {
                var p = n[l],
                  g = a[p],
                  m = r[l],
                  w = m.validate(g, y(e, p, m, g));
                if (u(w)) v(c, w.left);
                else {
                  var O = w.right;
                  (O !== g || (void 0 === O && !b.call(a, p))) &&
                    (a === s && (a = f({}, s)), (a[p] = O));
                }
              }
              return c.length > 0 ? h(c) : d(a);
            },
            (function (t) {
              for (var e = 0; e < t.length; e++)
                if (t[e].encode !== m) return !1;
              return !0;
            })(r)
              ? m
              : function (t) {
                  for (var e = f({}, t), o = 0; o < i; o++) {
                    var s = n[o],
                      a = r[o].encode;
                    a !== m && (e[s] = a(t[s]));
                  }
                  return e;
                },
            t
          );
        })({ DEBUG: A, API_BASE_URL: A }),
        'Config'
      );
      var P = n(324);
      const L = n.n(P)()('@yttrex'),
        N = (t, e) => {
          const n = (null != e ? e : L).extend(t);
          return {
            info: n.extend('info'),
            error: n.extend('error'),
            debug: n.extend('debug'),
            extend: (t) => N(t, n),
          };
        },
        U = require('assert'),
        $ = {
          right: function (t, e) {
            t = t.trim();
            const n = z.stringWidth(t);
            return n < e ? ' '.repeat(e - n) + t : t;
          },
          center: function (t, e) {
            t = t.trim();
            const n = z.stringWidth(t);
            return n >= e ? t : ' '.repeat((e - n) >> 1) + t;
          },
        };
      class W {
        constructor(t) {
          var e;
          (this.width = t.width),
            (this.wrap = null === (e = t.wrap) || void 0 === e || e),
            (this.rows = []);
        }
        span(...t) {
          this.div(...t).span = !0;
        }
        resetOutput() {
          this.rows = [];
        }
        div(...t) {
          if (
            (0 === t.length && this.div(''),
            this.wrap &&
              this.shouldApplyLayoutDSL(...t) &&
              'string' == typeof t[0])
          )
            return this.applyLayoutDSL(t[0]);
          const e = t.map((t) =>
            'string' == typeof t ? this.colFromString(t) : t
          );
          return this.rows.push(e), e;
        }
        shouldApplyLayoutDSL(...t) {
          return (
            1 === t.length && 'string' == typeof t[0] && /[\t\n]/.test(t[0])
          );
        }
        applyLayoutDSL(t) {
          const e = t.split('\n').map((t) => t.split('\t'));
          let n = 0;
          return (
            e.forEach((t) => {
              t.length > 1 &&
                z.stringWidth(t[0]) > n &&
                (n = Math.min(
                  Math.floor(0.5 * this.width),
                  z.stringWidth(t[0])
                ));
            }),
            e.forEach((t) => {
              this.div(
                ...t.map((e, r) => ({
                  text: e.trim(),
                  padding: this.measurePadding(e),
                  width: 0 === r && t.length > 1 ? n : void 0,
                }))
              );
            }),
            this.rows[this.rows.length - 1]
          );
        }
        colFromString(t) {
          return { text: t, padding: this.measurePadding(t) };
        }
        measurePadding(t) {
          const e = z.stripAnsi(t);
          return [0, e.match(/\s*$/)[0].length, 0, e.match(/^\s*/)[0].length];
        }
        toString() {
          const t = [];
          return (
            this.rows.forEach((e) => {
              this.rowToString(e, t);
            }),
            t
              .filter((t) => !t.hidden)
              .map((t) => t.text)
              .join('\n')
          );
        }
        rowToString(t, e) {
          return (
            this.rasterize(t).forEach((n, r) => {
              let i = '';
              n.forEach((n, o) => {
                const { width: s } = t[o],
                  a = this.negatePadding(t[o]);
                let c = n;
                a > z.stringWidth(n) && (c += ' '.repeat(a - z.stringWidth(n))),
                  t[o].align &&
                    'left' !== t[o].align &&
                    this.wrap &&
                    ((c = (0, $[t[o].align])(c, a)),
                    z.stringWidth(c) < a &&
                      (c += ' '.repeat((s || 0) - z.stringWidth(c) - 1)));
                const u = t[o].padding || [0, 0, 0, 0];
                u[3] && (i += ' '.repeat(u[3])),
                  (i += D(t[o], c, '| ')),
                  (i += c),
                  (i += D(t[o], c, ' |')),
                  u[1] && (i += ' '.repeat(u[1])),
                  0 === r &&
                    e.length > 0 &&
                    (i = this.renderInline(i, e[e.length - 1]));
              }),
                e.push({ text: i.replace(/ +$/, ''), span: t.span });
            }),
            e
          );
        }
        renderInline(t, e) {
          const n = t.match(/^ */),
            r = n ? n[0].length : 0,
            i = e.text,
            o = z.stringWidth(i.trimRight());
          return e.span
            ? this.wrap
              ? r < o
                ? t
                : ((e.hidden = !0),
                  i.trimRight() + ' '.repeat(r - o) + t.trimLeft())
              : ((e.hidden = !0), i + t)
            : t;
        }
        rasterize(t) {
          const e = [],
            n = this.columnWidths(t);
          let r;
          return (
            t.forEach((t, i) => {
              (t.width = n[i]),
                (r = this.wrap
                  ? z
                      .wrap(t.text, this.negatePadding(t), { hard: !0 })
                      .split('\n')
                  : t.text.split('\n')),
                t.border &&
                  (r.unshift('.' + '-'.repeat(this.negatePadding(t) + 2) + '.'),
                  r.push("'" + '-'.repeat(this.negatePadding(t) + 2) + "'")),
                t.padding &&
                  (r.unshift(...new Array(t.padding[0] || 0).fill('')),
                  r.push(...new Array(t.padding[2] || 0).fill(''))),
                r.forEach((t, n) => {
                  e[n] || e.push([]);
                  const r = e[n];
                  for (let t = 0; t < i; t++) void 0 === r[t] && r.push('');
                  r.push(t);
                });
            }),
            e
          );
        }
        negatePadding(t) {
          let e = t.width || 0;
          return (
            t.padding && (e -= (t.padding[3] || 0) + (t.padding[1] || 0)),
            t.border && (e -= 4),
            e
          );
        }
        columnWidths(t) {
          if (!this.wrap) return t.map((t) => t.width || z.stringWidth(t.text));
          let e = t.length,
            n = this.width;
          const r = t.map((t) => {
              if (t.width) return e--, (n -= t.width), t.width;
            }),
            i = e ? Math.floor(n / e) : 0;
          return r.map((e, n) =>
            void 0 === e
              ? Math.max(
                  i,
                  (function (t) {
                    const e = t.padding || [],
                      n = 1 + (e[3] || 0) + (e[1] || 0);
                    return t.border ? n + 4 : n;
                  })(t[n])
                )
              : e
          );
        }
      }
      function D(t, e, n) {
        return t.border
          ? /[.']-+[.']/.test(e)
            ? ''
            : 0 !== e.trim().length
            ? n
            : '  '
          : '';
      }
      let z;
      const q = new RegExp(
        '(?:\\[(?:\\d+[ABCDEFGJKSTm]|\\d+;\\d+[Hfm]|\\d+;\\d+;\\d+m|6n|s|u|\\?25[lh])|\\w)',
        'g'
      );
      function B(t) {
        return t.replace(q, '');
      }
      function V(t, e) {
        const [n, r] = t.match(q) || ['', ''];
        t = B(t);
        let i = '';
        for (let n = 0; n < t.length; n++)
          0 !== n && n % e == 0 && (i += '\n'), (i += t.charAt(n));
        return n && r && (i = `${n}${i}${r}`), i;
      }
      var H = n(17),
        K = n(147),
        G = n(837);
      const J = require('url');
      function Y(t) {
        if (
          ((t !== t.toLowerCase() && t !== t.toUpperCase()) ||
            (t = t.toLowerCase()),
          -1 === t.indexOf('-') && -1 === t.indexOf('_'))
        )
          return t;
        {
          let e = '',
            n = !1;
          const r = t.match(/^-+/);
          for (let i = r ? r[0].length : 0; i < t.length; i++) {
            let r = t.charAt(i);
            n && ((n = !1), (r = r.toUpperCase())),
              0 === i || ('-' !== r && '_' !== r)
                ? '-' !== r && '_' !== r && (e += r)
                : (n = !0);
          }
          return e;
        }
      }
      function Q(t, e) {
        const n = t.toLowerCase();
        e = e || '-';
        let r = '';
        for (let i = 0; i < t.length; i++) {
          const o = n.charAt(i),
            s = t.charAt(i);
          r += o !== s && i > 0 ? `${e}${n.charAt(i)}` : s;
        }
        return r;
      }
      function Z(t) {
        return (
          null != t &&
          ('number' == typeof t ||
            !!/^0x[0-9a-f]+$/i.test(t) ||
            (!/^0[^.]/.test(t) &&
              /^[-]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(t)))
        );
      }
      var X;
      let tt;
      function et(t) {
        return void 0 !== t ? t + 1 : 1;
      }
      function nt(t) {
        return '__proto__' === t ? '___proto___' : t;
      }
      !(function (t) {
        (t.BOOLEAN = 'boolean'),
          (t.STRING = 'string'),
          (t.NUMBER = 'number'),
          (t.ARRAY = 'array');
      })(X || (X = {}));
      const rt =
        process && process.env && process.env.YARGS_MIN_NODE_VERSION
          ? Number(process.env.YARGS_MIN_NODE_VERSION)
          : 12;
      if (
        process &&
        process.version &&
        Number(process.version.match(/v([^.]+)/)[1]) < rt
      )
        throw Error(
          `yargs parser supports a minimum Node.js version of ${rt}. Read our version support policy: https://github.com/yargs/yargs-parser#supported-nodejs-versions`
        );
      const it = process ? process.env : {},
        ot = new (class {
          constructor(t) {
            tt = t;
          }
          parse(t, e) {
            const n = Object.assign(
                {
                  alias: void 0,
                  array: void 0,
                  boolean: void 0,
                  config: void 0,
                  configObjects: void 0,
                  configuration: void 0,
                  coerce: void 0,
                  count: void 0,
                  default: void 0,
                  envPrefix: void 0,
                  narg: void 0,
                  normalize: void 0,
                  string: void 0,
                  number: void 0,
                  __: void 0,
                  key: void 0,
                },
                e
              ),
              r = (function (t) {
                if (Array.isArray(t))
                  return t.map((t) => ('string' != typeof t ? t + '' : t));
                t = t.trim();
                let e = 0,
                  n = null,
                  r = null,
                  i = null;
                const o = [];
                for (let s = 0; s < t.length; s++)
                  (n = r),
                    (r = t.charAt(s)),
                    ' ' !== r || i
                      ? (r === i
                          ? (i = null)
                          : ("'" !== r && '"' !== r) || i || (i = r),
                        o[e] || (o[e] = ''),
                        (o[e] += r))
                      : ' ' !== n && e++;
                return o;
              })(t),
              i = 'string' == typeof t,
              o = (function (t) {
                const e = [],
                  n = Object.create(null);
                let r = !0;
                for (
                  Object.keys(t).forEach(function (n) {
                    e.push([].concat(t[n], n));
                  });
                  r;

                ) {
                  r = !1;
                  for (let t = 0; t < e.length; t++)
                    for (let n = t + 1; n < e.length; n++)
                      if (
                        e[t].filter(function (t) {
                          return -1 !== e[n].indexOf(t);
                        }).length
                      ) {
                        (e[t] = e[t].concat(e[n])), e.splice(n, 1), (r = !0);
                        break;
                      }
                }
                return (
                  e.forEach(function (t) {
                    const e = (t = t.filter(function (t, e, n) {
                      return n.indexOf(t) === e;
                    })).pop();
                    void 0 !== e && 'string' == typeof e && (n[e] = t);
                  }),
                  n
                );
              })(Object.assign(Object.create(null), n.alias)),
              s = Object.assign(
                {
                  'boolean-negation': !0,
                  'camel-case-expansion': !0,
                  'combine-arrays': !1,
                  'dot-notation': !0,
                  'duplicate-arguments-array': !0,
                  'flatten-duplicate-arrays': !0,
                  'greedy-arrays': !0,
                  'halt-at-non-option': !1,
                  'nargs-eats-options': !1,
                  'negation-prefix': 'no-',
                  'parse-numbers': !0,
                  'parse-positional-numbers': !0,
                  'populate--': !1,
                  'set-placeholder-key': !1,
                  'short-option-groups': !0,
                  'strip-aliased': !1,
                  'strip-dashed': !1,
                  'unknown-options-as-args': !1,
                },
                n.configuration
              ),
              a = Object.assign(Object.create(null), n.default),
              c = n.configObjects || [],
              u = n.envPrefix,
              l = s['populate--'],
              f = l ? '--' : '_',
              h = Object.create(null),
              p = Object.create(null),
              d = n.__ || tt.format,
              g = {
                aliases: Object.create(null),
                arrays: Object.create(null),
                bools: Object.create(null),
                strings: Object.create(null),
                numbers: Object.create(null),
                counts: Object.create(null),
                normalize: Object.create(null),
                configs: Object.create(null),
                nargs: Object.create(null),
                coercions: Object.create(null),
                keys: [],
              },
              m = /^-([0-9]+(\.[0-9]+)?|\.[0-9]+)$/,
              y = new RegExp('^--' + s['negation-prefix'] + '(.+)');
            []
              .concat(n.array || [])
              .filter(Boolean)
              .forEach(function (t) {
                const e = 'object' == typeof t ? t.key : t,
                  n = Object.keys(t)
                    .map(function (t) {
                      return {
                        boolean: 'bools',
                        string: 'strings',
                        number: 'numbers',
                      }[t];
                    })
                    .filter(Boolean)
                    .pop();
                n && (g[n][e] = !0), (g.arrays[e] = !0), g.keys.push(e);
              }),
              []
                .concat(n.boolean || [])
                .filter(Boolean)
                .forEach(function (t) {
                  (g.bools[t] = !0), g.keys.push(t);
                }),
              []
                .concat(n.string || [])
                .filter(Boolean)
                .forEach(function (t) {
                  (g.strings[t] = !0), g.keys.push(t);
                }),
              []
                .concat(n.number || [])
                .filter(Boolean)
                .forEach(function (t) {
                  (g.numbers[t] = !0), g.keys.push(t);
                }),
              []
                .concat(n.count || [])
                .filter(Boolean)
                .forEach(function (t) {
                  (g.counts[t] = !0), g.keys.push(t);
                }),
              []
                .concat(n.normalize || [])
                .filter(Boolean)
                .forEach(function (t) {
                  (g.normalize[t] = !0), g.keys.push(t);
                }),
              'object' == typeof n.narg &&
                Object.entries(n.narg).forEach(([t, e]) => {
                  'number' == typeof e && ((g.nargs[t] = e), g.keys.push(t));
                }),
              'object' == typeof n.coerce &&
                Object.entries(n.coerce).forEach(([t, e]) => {
                  'function' == typeof e &&
                    ((g.coercions[t] = e), g.keys.push(t));
                }),
              void 0 !== n.config &&
                (Array.isArray(n.config) || 'string' == typeof n.config
                  ? []
                      .concat(n.config)
                      .filter(Boolean)
                      .forEach(function (t) {
                        g.configs[t] = !0;
                      })
                  : 'object' == typeof n.config &&
                    Object.entries(n.config).forEach(([t, e]) => {
                      ('boolean' != typeof e && 'function' != typeof e) ||
                        (g.configs[t] = e);
                    })),
              (function (...t) {
                t.forEach(function (t) {
                  Object.keys(t || {}).forEach(function (t) {
                    g.aliases[t] ||
                      ((g.aliases[t] = [].concat(o[t] || [])),
                      g.aliases[t].concat(t).forEach(function (e) {
                        if (/-/.test(e) && s['camel-case-expansion']) {
                          const n = Y(e);
                          n !== t &&
                            -1 === g.aliases[t].indexOf(n) &&
                            (g.aliases[t].push(n), (h[n] = !0));
                        }
                      }),
                      g.aliases[t].concat(t).forEach(function (e) {
                        if (
                          e.length > 1 &&
                          /[A-Z]/.test(e) &&
                          s['camel-case-expansion']
                        ) {
                          const n = Q(e, '-');
                          n !== t &&
                            -1 === g.aliases[t].indexOf(n) &&
                            (g.aliases[t].push(n), (h[n] = !0));
                        }
                      }),
                      g.aliases[t].forEach(function (e) {
                        g.aliases[e] = [t].concat(
                          g.aliases[t].filter(function (t) {
                            return e !== t;
                          })
                        );
                      }));
                  });
                });
              })(n.key, o, n.default, g.arrays),
              Object.keys(a).forEach(function (t) {
                (g.aliases[t] || []).forEach(function (e) {
                  a[e] = a[t];
                });
              });
            let v = null;
            Object.keys(g.counts).find((t) =>
              F(t, g.arrays)
                ? ((v = Error(
                    d(
                      'Invalid configuration: %s, opts.count excludes opts.array.',
                      t
                    )
                  )),
                  !0)
                : !!F(t, g.nargs) &&
                  ((v = Error(
                    d(
                      'Invalid configuration: %s, opts.count excludes opts.narg.',
                      t
                    )
                  )),
                  !0)
            );
            let b = [];
            const w = Object.assign(Object.create(null), { _: [] }),
              O = {};
            for (let t = 0; t < r.length; t++) {
              const e = r[t],
                n = e.replace(/^-{3,}/, '---');
              let i, o, a, c, u, l;
              if ('--' !== e && L(e)) _(e);
              else {
                if (n.match(/---+(=|$)/)) {
                  _(e);
                  continue;
                }
                if (
                  e.match(/^--.+=/) ||
                  (!s['short-option-groups'] && e.match(/^-.+=/))
                )
                  (c = e.match(/^--?([^=]+)=([\s\S]*)$/)),
                    null !== c &&
                      Array.isArray(c) &&
                      c.length >= 3 &&
                      (F(c[1], g.arrays)
                        ? (t = j(t, c[1], r, c[2]))
                        : !1 !== F(c[1], g.nargs)
                        ? (t = C(t, c[1], r, c[2]))
                        : A(c[1], c[2], !0));
                else if (e.match(y) && s['boolean-negation'])
                  (c = e.match(y)),
                    null !== c &&
                      Array.isArray(c) &&
                      c.length >= 2 &&
                      ((o = c[1]), A(o, !!F(o, g.arrays) && [!1]));
                else if (
                  e.match(/^--.+/) ||
                  (!s['short-option-groups'] && e.match(/^-[^-]+/))
                )
                  (c = e.match(/^--?(.+)/)),
                    null !== c &&
                      Array.isArray(c) &&
                      c.length >= 2 &&
                      ((o = c[1]),
                      F(o, g.arrays)
                        ? (t = j(t, o, r))
                        : !1 !== F(o, g.nargs)
                        ? (t = C(t, o, r))
                        : ((u = r[t + 1]),
                          void 0 === u ||
                          (u.match(/^-/) && !u.match(m)) ||
                          F(o, g.bools) ||
                          F(o, g.counts)
                            ? /^(true|false)$/.test(u)
                              ? (A(o, u), t++)
                              : A(o, N(o))
                            : (A(o, u), t++)));
                else if (e.match(/^-.\..+=/))
                  (c = e.match(/^-([^=]+)=([\s\S]*)$/)),
                    null !== c &&
                      Array.isArray(c) &&
                      c.length >= 3 &&
                      A(c[1], c[2]);
                else if (e.match(/^-.\..+/) && !e.match(m))
                  (u = r[t + 1]),
                    (c = e.match(/^-(.\..+)/)),
                    null !== c &&
                      Array.isArray(c) &&
                      c.length >= 2 &&
                      ((o = c[1]),
                      void 0 === u ||
                      u.match(/^-/) ||
                      F(o, g.bools) ||
                      F(o, g.counts)
                        ? A(o, N(o))
                        : (A(o, u), t++));
                else if (e.match(/^-[^-]+/) && !e.match(m)) {
                  (a = e.slice(1, -1).split('')), (i = !1);
                  for (let n = 0; n < a.length; n++) {
                    if (((u = e.slice(n + 2)), a[n + 1] && '=' === a[n + 1])) {
                      (l = e.slice(n + 3)),
                        (o = a[n]),
                        F(o, g.arrays)
                          ? (t = j(t, o, r, l))
                          : !1 !== F(o, g.nargs)
                          ? (t = C(t, o, r, l))
                          : A(o, l),
                        (i = !0);
                      break;
                    }
                    if ('-' !== u) {
                      if (
                        /[A-Za-z]/.test(a[n]) &&
                        /^-?\d+(\.\d*)?(e-?\d+)?$/.test(u) &&
                        !1 === F(u, g.bools)
                      ) {
                        A(a[n], u), (i = !0);
                        break;
                      }
                      if (a[n + 1] && a[n + 1].match(/\W/)) {
                        A(a[n], u), (i = !0);
                        break;
                      }
                      A(a[n], N(a[n]));
                    } else A(a[n], u);
                  }
                  (o = e.slice(-1)[0]),
                    i ||
                      '-' === o ||
                      (F(o, g.arrays)
                        ? (t = j(t, o, r))
                        : !1 !== F(o, g.nargs)
                        ? (t = C(t, o, r))
                        : ((u = r[t + 1]),
                          void 0 === u ||
                          (/^(-|--)[^-]/.test(u) && !u.match(m)) ||
                          F(o, g.bools) ||
                          F(o, g.counts)
                            ? /^(true|false)$/.test(u)
                              ? (A(o, u), t++)
                              : A(o, N(o))
                            : (A(o, u), t++)));
                } else if (
                  e.match(/^-[0-9]$/) &&
                  e.match(m) &&
                  F(e.slice(1), g.bools)
                )
                  (o = e.slice(1)), A(o, N(o));
                else {
                  if ('--' === e) {
                    b = r.slice(t + 1);
                    break;
                  }
                  if (s['halt-at-non-option']) {
                    b = r.slice(t);
                    break;
                  }
                  _(e);
                }
              }
            }
            function _(t) {
              const e = x('_', t);
              ('string' != typeof e && 'number' != typeof e) || w._.push(e);
            }
            function C(t, e, n, r) {
              let i,
                o = F(e, g.nargs);
              if (((o = 'number' != typeof o || isNaN(o) ? 1 : o), 0 === o))
                return (
                  U(r) || (v = Error(d('Argument unexpected for: %s', e))),
                  A(e, N(e)),
                  t
                );
              let a = U(r) ? 0 : 1;
              if (s['nargs-eats-options'])
                n.length - (t + 1) + a < o &&
                  (v = Error(d('Not enough arguments following: %s', e))),
                  (a = o);
              else {
                for (
                  i = t + 1;
                  i < n.length &&
                  (!n[i].match(/^-[^0-9]/) || n[i].match(m) || L(n[i]));
                  i++
                )
                  a++;
                a < o &&
                  (v = Error(d('Not enough arguments following: %s', e)));
              }
              let c = Math.min(a, o);
              for (
                !U(r) && c > 0 && (A(e, r), c--), i = t + 1;
                i < c + t + 1;
                i++
              )
                A(e, n[i]);
              return t + c;
            }
            function j(t, e, n, r) {
              let o = [],
                c = r || n[t + 1];
              const u = F(e, g.nargs);
              if (F(e, g.bools) && !/^(true|false)$/.test(c)) o.push(!0);
              else if (U(c) || (U(r) && /^-/.test(c) && !m.test(c) && !L(c))) {
                if (void 0 !== a[e]) {
                  const t = a[e];
                  o = Array.isArray(t) ? t : [t];
                }
              } else {
                U(r) || o.push(k(e, r, !0));
                for (
                  let r = t + 1;
                  r < n.length &&
                  !(
                    (!s['greedy-arrays'] && o.length > 0) ||
                    (u && 'number' == typeof u && o.length >= u)
                  ) &&
                  ((c = n[r]), !/^-/.test(c) || m.test(c) || L(c));
                  r++
                )
                  (t = r), o.push(k(e, c, i));
              }
              return (
                'number' == typeof u &&
                  ((u && o.length < u) || (isNaN(u) && 0 === o.length)) &&
                  (v = Error(d('Not enough arguments following: %s', e))),
                A(e, o),
                t
              );
            }
            function A(t, e, n = i) {
              if (/-/.test(t) && s['camel-case-expansion']) {
                const e = t
                  .split('.')
                  .map(function (t) {
                    return Y(t);
                  })
                  .join('.');
                E(t, e);
              }
              const r = k(t, e, n),
                o = t.split('.');
              R(w, o, r),
                g.aliases[t] &&
                  g.aliases[t].forEach(function (t) {
                    const e = t.split('.');
                    R(w, e, r);
                  }),
                o.length > 1 &&
                  s['dot-notation'] &&
                  (g.aliases[o[0]] || []).forEach(function (e) {
                    let n = e.split('.');
                    const i = [].concat(o);
                    i.shift(),
                      (n = n.concat(i)),
                      (g.aliases[t] || []).includes(n.join('.')) || R(w, n, r);
                  }),
                F(t, g.normalize) &&
                  !F(t, g.arrays) &&
                  [t].concat(g.aliases[t] || []).forEach(function (t) {
                    Object.defineProperty(O, t, {
                      enumerable: !0,
                      get: () => e,
                      set(t) {
                        e = 'string' == typeof t ? tt.normalize(t) : t;
                      },
                    });
                  });
            }
            function E(t, e) {
              (g.aliases[t] && g.aliases[t].length) ||
                ((g.aliases[t] = [e]), (h[e] = !0)),
                (g.aliases[e] && g.aliases[e].length) || E(e, t);
            }
            function k(t, e, n) {
              n &&
                (e = (function (t) {
                  return 'string' != typeof t ||
                    ("'" !== t[0] && '"' !== t[0]) ||
                    t[t.length - 1] !== t[0]
                    ? t
                    : t.substring(1, t.length - 1);
                })(e)),
                (F(t, g.bools) || F(t, g.counts)) &&
                  'string' == typeof e &&
                  (e = 'true' === e);
              let r = Array.isArray(e)
                ? e.map(function (e) {
                    return x(t, e);
                  })
                : x(t, e);
              return (
                F(t, g.counts) && (U(r) || 'boolean' == typeof r) && (r = et()),
                F(t, g.normalize) &&
                  F(t, g.arrays) &&
                  (r = Array.isArray(e)
                    ? e.map((t) => tt.normalize(t))
                    : tt.normalize(e)),
                r
              );
            }
            function x(t, e) {
              return s['parse-positional-numbers'] || '_' !== t
                ? (F(t, g.strings) ||
                    F(t, g.bools) ||
                    Array.isArray(e) ||
                    (((Z(e) &&
                      s['parse-numbers'] &&
                      Number.isSafeInteger(Math.floor(parseFloat(`${e}`)))) ||
                      (!U(e) && F(t, g.numbers))) &&
                      (e = Number(e))),
                  e)
                : e;
            }
            function S(t, e) {
              Object.keys(t).forEach(function (n) {
                const r = t[n],
                  i = e ? e + '.' + n : n;
                'object' == typeof r &&
                null !== r &&
                !Array.isArray(r) &&
                s['dot-notation']
                  ? S(r, i)
                  : (!I(w, i.split('.')) ||
                      (F(i, g.arrays) && s['combine-arrays'])) &&
                    A(i, r);
              });
            }
            function T(t, e) {
              if (void 0 === u) return;
              const n = 'string' == typeof u ? u : '',
                r = tt.env();
              Object.keys(r).forEach(function (i) {
                if ('' === n || 0 === i.lastIndexOf(n, 0)) {
                  const o = i.split('__').map(function (t, e) {
                    return 0 === e && (t = t.substring(n.length)), Y(t);
                  });
                  ((e && g.configs[o.join('.')]) || !e) &&
                    !I(t, o) &&
                    A(o.join('.'), r[i]);
                }
              });
            }
            function M(t, e, n, r = !1) {
              Object.keys(n).forEach(function (i) {
                I(t, i.split('.')) ||
                  (R(t, i.split('.'), n[i]),
                  r && (p[i] = !0),
                  (e[i] || []).forEach(function (e) {
                    I(t, e.split('.')) || R(t, e.split('.'), n[i]);
                  }));
              });
            }
            function I(t, e) {
              let n = t;
              s['dot-notation'] || (e = [e.join('.')]),
                e.slice(0, -1).forEach(function (t) {
                  n = n[t] || {};
                });
              const r = e[e.length - 1];
              return 'object' == typeof n && r in n;
            }
            function R(t, e, n) {
              let r = t;
              s['dot-notation'] || (e = [e.join('.')]),
                e.slice(0, -1).forEach(function (t) {
                  (t = nt(t)),
                    'object' == typeof r && void 0 === r[t] && (r[t] = {}),
                    'object' != typeof r[t] || Array.isArray(r[t])
                      ? (Array.isArray(r[t])
                          ? r[t].push({})
                          : (r[t] = [r[t], {}]),
                        (r = r[t][r[t].length - 1]))
                      : (r = r[t]);
                });
              const i = nt(e[e.length - 1]),
                o = F(e.join('.'), g.arrays),
                a = Array.isArray(n);
              let c = s['duplicate-arguments-array'];
              !c &&
                F(i, g.nargs) &&
                ((c = !0),
                ((!U(r[i]) && 1 === g.nargs[i]) ||
                  (Array.isArray(r[i]) && r[i].length === g.nargs[i])) &&
                  (r[i] = void 0)),
                n === et()
                  ? (r[i] = et(r[i]))
                  : Array.isArray(r[i])
                  ? c && o && a
                    ? (r[i] = s['flatten-duplicate-arrays']
                        ? r[i].concat(n)
                        : (Array.isArray(r[i][0]) ? r[i] : [r[i]]).concat([n]))
                    : c || Boolean(o) !== Boolean(a)
                    ? (r[i] = r[i].concat([n]))
                    : (r[i] = n)
                  : void 0 === r[i] && o
                  ? (r[i] = a ? n : [n])
                  : !c || void 0 === r[i] || F(i, g.counts) || F(i, g.bools)
                  ? (r[i] = n)
                  : (r[i] = [r[i], n]);
            }
            function F(t, e) {
              const n = [].concat(g.aliases[t] || [], t),
                r = Object.keys(e),
                i = n.find((t) => r.includes(t));
              return !!i && e[i];
            }
            function P(t) {
              const e = Object.keys(g);
              return [].concat(e.map((t) => g[t])).some(function (e) {
                return Array.isArray(e) ? e.includes(t) : e[t];
              });
            }
            function L(t) {
              return (
                s['unknown-options-as-args'] &&
                (function (t) {
                  return (
                    !(t = t.replace(/^-{3,}/, '--')).match(m) &&
                    !(function (t) {
                      if (t.match(m) || !t.match(/^-[^-]+/)) return !1;
                      let e,
                        n = !0;
                      const r = t.slice(1).split('');
                      for (let i = 0; i < r.length; i++) {
                        if (((e = t.slice(i + 2)), !P(r[i]))) {
                          n = !1;
                          break;
                        }
                        if (
                          (r[i + 1] && '=' === r[i + 1]) ||
                          '-' === e ||
                          (/[A-Za-z]/.test(r[i]) &&
                            /^-?\d+(\.\d*)?(e-?\d+)?$/.test(e)) ||
                          (r[i + 1] && r[i + 1].match(/\W/))
                        )
                          break;
                      }
                      return n;
                    })(t) &&
                    !(function (t, ...e) {
                      return [].concat(...e).some(function (e) {
                        const n = t.match(e);
                        return n && P(n[1]);
                      });
                    })(
                      t,
                      /^-+([^=]+?)=[\s\S]*$/,
                      y,
                      /^-+([^=]+?)$/,
                      /^-+([^=]+?)-$/,
                      /^-+([^=]+?\d+)$/,
                      /^-+([^=]+?)\W+.*$/
                    )
                  );
                })(t)
              );
            }
            function N(t) {
              return F(t, g.bools) || F(t, g.counts) || !(`${t}` in a)
                ? ((e = (function (t) {
                    let e = X.BOOLEAN;
                    return (
                      F(t, g.strings)
                        ? (e = X.STRING)
                        : F(t, g.numbers)
                        ? (e = X.NUMBER)
                        : F(t, g.bools)
                        ? (e = X.BOOLEAN)
                        : F(t, g.arrays) && (e = X.ARRAY),
                      e
                    );
                  })(t)),
                  {
                    [X.BOOLEAN]: !0,
                    [X.STRING]: '',
                    [X.NUMBER]: void 0,
                    [X.ARRAY]: [],
                  }[e])
                : a[t];
              var e;
            }
            function U(t) {
              return void 0 === t;
            }
            return (
              T(w, !0),
              T(w, !1),
              (function (t) {
                const e = Object.create(null);
                M(e, g.aliases, a),
                  Object.keys(g.configs).forEach(function (n) {
                    const r = t[n] || e[n];
                    if (r)
                      try {
                        let t = null;
                        const e = tt.resolve(tt.cwd(), r),
                          i = g.configs[n];
                        if ('function' == typeof i) {
                          try {
                            t = i(e);
                          } catch (e) {
                            t = e;
                          }
                          if (t instanceof Error) return void (v = t);
                        } else t = tt.require(e);
                        S(t);
                      } catch (e) {
                        'PermissionDenied' === e.name
                          ? (v = e)
                          : t[n] &&
                            (v = Error(d('Invalid JSON config file: %s', r)));
                      }
                  });
              })(w),
              void 0 !== c &&
                c.forEach(function (t) {
                  S(t);
                }),
              M(w, g.aliases, a, !0),
              (function (t) {
                let e;
                const n = new Set();
                Object.keys(t).forEach(function (r) {
                  if (
                    !n.has(r) &&
                    ((e = F(r, g.coercions)), 'function' == typeof e)
                  )
                    try {
                      const i = x(r, e(t[r]));
                      [].concat(g.aliases[r] || [], r).forEach((e) => {
                        n.add(e), (t[e] = i);
                      });
                    } catch (t) {
                      v = t;
                    }
                });
              })(w),
              s['set-placeholder-key'] &&
                (function (t) {
                  g.keys.forEach((e) => {
                    ~e.indexOf('.') || (void 0 === t[e] && (t[e] = void 0));
                  });
                })(w),
              Object.keys(g.counts).forEach(function (t) {
                I(w, t.split('.')) || A(t, 0);
              }),
              l && b.length && (w[f] = []),
              b.forEach(function (t) {
                w[f].push(t);
              }),
              s['camel-case-expansion'] &&
                s['strip-dashed'] &&
                Object.keys(w)
                  .filter((t) => '--' !== t && t.includes('-'))
                  .forEach((t) => {
                    delete w[t];
                  }),
              s['strip-aliased'] &&
                [].concat(...Object.keys(o).map((t) => o[t])).forEach((t) => {
                  s['camel-case-expansion'] &&
                    t.includes('-') &&
                    delete w[
                      t
                        .split('.')
                        .map((t) => Y(t))
                        .join('.')
                    ],
                    delete w[t];
                }),
              {
                aliases: Object.assign({}, g.aliases),
                argv: Object.assign(O, w),
                configuration: s,
                defaulted: Object.assign({}, p),
                error: v,
                newAliases: Object.assign({}, h),
              }
            );
          }
        })({
          cwd: process.cwd,
          env: () => it,
          format: G.format,
          normalize: H.normalize,
          resolve: H.resolve,
          require: (t) => {
            if ('undefined' != typeof require) return require(t);
            if (t.match(/\.json$/))
              return JSON.parse((0, K.readFileSync)(t, 'utf8'));
            throw Error('only .json config files are supported in ESM');
          },
        }),
        st = function (t, e) {
          return ot.parse(t.slice(), e).argv;
        };
      (st.detailed = function (t, e) {
        return ot.parse(t.slice(), e);
      }),
        (st.camelCase = Y),
        (st.decamelize = Q),
        (st.looksLikeNumber = Z);
      const at = st;
      function ct() {
        return process.versions.electron && !process.defaultApp ? 0 : 1;
      }
      class ut extends Error {
        constructor(t) {
          super(t || 'yargs error'),
            (this.name = 'YError'),
            Error.captureStackTrace(this, ut);
        }
      }
      const lt = {
        fs: { readFileSync: K.readFileSync, writeFile: K.writeFile },
        format: G.format,
        resolve: H.resolve,
        exists: (t) => {
          try {
            return (0, K.statSync)(t).isFile();
          } catch (t) {
            return !1;
          }
        },
      };
      let ft;
      class ht {
        constructor(t) {
          (t = t || {}),
            (this.directory = t.directory || './locales'),
            (this.updateFiles =
              'boolean' != typeof t.updateFiles || t.updateFiles),
            (this.locale = t.locale || 'en'),
            (this.fallbackToLanguage =
              'boolean' != typeof t.fallbackToLanguage || t.fallbackToLanguage),
            (this.cache = Object.create(null)),
            (this.writeQueue = []);
        }
        __(...t) {
          if ('string' != typeof arguments[0])
            return this._taggedLiteral(arguments[0], ...arguments);
          const e = t.shift();
          let n = function () {};
          return (
            'function' == typeof t[t.length - 1] && (n = t.pop()),
            (n = n || function () {}),
            this.cache[this.locale] || this._readLocaleFile(),
            !this.cache[this.locale][e] && this.updateFiles
              ? ((this.cache[this.locale][e] = e),
                this._enqueueWrite({
                  directory: this.directory,
                  locale: this.locale,
                  cb: n,
                }))
              : n(),
            ft.format.apply(
              ft.format,
              [this.cache[this.locale][e] || e].concat(t)
            )
          );
        }
        __n() {
          const t = Array.prototype.slice.call(arguments),
            e = t.shift(),
            n = t.shift(),
            r = t.shift();
          let i = function () {};
          'function' == typeof t[t.length - 1] && (i = t.pop()),
            this.cache[this.locale] || this._readLocaleFile();
          let o = 1 === r ? e : n;
          this.cache[this.locale][e] &&
            (o = this.cache[this.locale][e][1 === r ? 'one' : 'other']),
            !this.cache[this.locale][e] && this.updateFiles
              ? ((this.cache[this.locale][e] = { one: e, other: n }),
                this._enqueueWrite({
                  directory: this.directory,
                  locale: this.locale,
                  cb: i,
                }))
              : i();
          const s = [o];
          return (
            ~o.indexOf('%d') && s.push(r),
            ft.format.apply(ft.format, s.concat(t))
          );
        }
        setLocale(t) {
          this.locale = t;
        }
        getLocale() {
          return this.locale;
        }
        updateLocale(t) {
          this.cache[this.locale] || this._readLocaleFile();
          for (const e in t)
            Object.prototype.hasOwnProperty.call(t, e) &&
              (this.cache[this.locale][e] = t[e]);
        }
        _taggedLiteral(t, ...e) {
          let n = '';
          return (
            t.forEach(function (t, r) {
              const i = e[r + 1];
              (n += t), void 0 !== i && (n += '%s');
            }),
            this.__.apply(this, [n].concat([].slice.call(e, 1)))
          );
        }
        _enqueueWrite(t) {
          this.writeQueue.push(t),
            1 === this.writeQueue.length && this._processWriteQueue();
        }
        _processWriteQueue() {
          const t = this,
            e = this.writeQueue[0],
            n = e.directory,
            r = e.locale,
            i = e.cb,
            o = this._resolveLocaleFile(n, r),
            s = JSON.stringify(this.cache[r], null, 2);
          ft.fs.writeFile(o, s, 'utf-8', function (e) {
            t.writeQueue.shift(),
              t.writeQueue.length > 0 && t._processWriteQueue(),
              i(e);
          });
        }
        _readLocaleFile() {
          let t = {};
          const e = this._resolveLocaleFile(this.directory, this.locale);
          try {
            ft.fs.readFileSync &&
              (t = JSON.parse(ft.fs.readFileSync(e, 'utf-8')));
          } catch (n) {
            if (
              (n instanceof SyntaxError && (n.message = 'syntax error in ' + e),
              'ENOENT' !== n.code)
            )
              throw n;
            t = {};
          }
          this.cache[this.locale] = t;
        }
        _resolveLocaleFile(t, e) {
          let n = ft.resolve(t, './', e + '.json');
          if (
            this.fallbackToLanguage &&
            !this._fileExistsSync(n) &&
            ~e.lastIndexOf('_')
          ) {
            const r = ft.resolve(t, './', e.split('_')[0] + '.json');
            this._fileExistsSync(r) && (n = r);
          }
          return n;
        }
        _fileExistsSync(t) {
          return ft.exists(t);
        }
      }
      const pt = 'loading a directory of commands is not supported yet for ESM';
      let dt;
      try {
        dt = (0, J.fileURLToPath)(
          'file:///home/djfm/work/yttrex/node_modules/yargs/lib/platform-shims/esm.mjs'
        );
      } catch (t) {
        dt = process.cwd();
      }
      const gt = dt.split('node_modules')[0],
        mt = {
          assert: {
            notStrictEqual: U.notStrictEqual,
            strictEqual: U.strictEqual,
          },
          cliui: function (t) {
            return (function (t, e) {
              return (
                (z = e),
                new W({
                  width:
                    (null == t ? void 0 : t.width) ||
                    ('object' == typeof process &&
                    process.stdout &&
                    process.stdout.columns
                      ? process.stdout.columns
                      : 80),
                  wrap: null == t ? void 0 : t.wrap,
                })
              );
            })(t, { stringWidth: (t) => [...t].length, stripAnsi: B, wrap: V });
          },
          findUp: function (t, e) {
            let n,
              r = (0, H.resolve)('.', t);
            for (
              (0, K.statSync)(r).isDirectory() || (r = (0, H.dirname)(r));
              ;

            ) {
              if (((n = e(r, (0, K.readdirSync)(r))), n))
                return (0, H.resolve)(r, n);
              if (((r = (0, H.dirname)((n = r))), n === r)) break;
            }
          },
          getEnv: (t) => process.env[t],
          inspect: G.inspect,
          getCallerFile: () => {
            throw new ut(pt);
          },
          getProcessArgvBin: function () {
            return process.argv[ct()];
          },
          mainFilename: gt || process.cwd(),
          Parser: at,
          path: {
            basename: H.basename,
            dirname: H.dirname,
            extname: H.extname,
            relative: H.relative,
            resolve: H.resolve,
          },
          process: {
            argv: () => process.argv,
            cwd: process.cwd,
            emitWarning: (t, e) => process.emitWarning(t, e),
            execPath: () => process.execPath,
            exit: process.exit,
            nextTick: process.nextTick,
            stdColumns:
              void 0 !== process.stdout.columns ? process.stdout.columns : null,
          },
          readFileSync: K.readFileSync,
          require: () => {
            throw new ut('require is not supported by ESM');
          },
          requireDirectory: () => {
            throw new ut(pt);
          },
          stringWidth: (t) => [...t].length,
          y18n:
            ((yt = {
              directory: (0, H.resolve)(dt, '../../../locales'),
              updateFiles: !1,
            }),
            (function (t, e) {
              ft = e;
              const n = new ht(t);
              return {
                __: n.__.bind(n),
                __n: n.__n.bind(n),
                setLocale: n.setLocale.bind(n),
                getLocale: n.getLocale.bind(n),
                updateLocale: n.updateLocale.bind(n),
                locale: n.locale,
              };
            })(yt, lt)),
        };
      var yt;
      function vt(t, e, n, r) {
        n.assert.notStrictEqual(t, e, r);
      }
      function bt(t, e) {
        e.assert.strictEqual(typeof t, 'string');
      }
      function wt(t) {
        return Object.keys(t);
      }
      function Ot(t) {
        return !!t && !!t.then && 'function' == typeof t.then;
      }
      function _t(t) {
        const e = t.replace(/\s{2,}/g, ' ').split(/\s+(?![^[]*]|[^<]*>)/),
          n = /\.*[\][<>]/g,
          r = e.shift();
        if (!r) throw new Error(`No command found in: ${t}`);
        const i = { cmd: r.replace(n, ''), demanded: [], optional: [] };
        return (
          e.forEach((t, r) => {
            let o = !1;
            (t = t.replace(/\s/g, '')),
              /\.+[\]>]/.test(t) && r === e.length - 1 && (o = !0),
              /^\[/.test(t)
                ? i.optional.push({
                    cmd: t.replace(n, '').split('|'),
                    variadic: o,
                  })
                : i.demanded.push({
                    cmd: t.replace(n, '').split('|'),
                    variadic: o,
                  });
          }),
          i
        );
      }
      const Ct = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
      function jt(t, e, n) {
        try {
          let r = 0;
          const [i, o, s] =
              'object' == typeof t
                ? [{ demanded: [], optional: [] }, t, e]
                : [_t(`cmd ${t}`), e, n],
            a = [].slice.call(o);
          for (; a.length && void 0 === a[a.length - 1]; ) a.pop();
          const c = s || a.length;
          if (c < i.demanded.length)
            throw new ut(
              `Not enough arguments provided. Expected ${i.demanded.length} but received ${a.length}.`
            );
          const u = i.demanded.length + i.optional.length;
          if (c > u)
            throw new ut(
              `Too many arguments provided. Expected max ${u} but received ${c}.`
            );
          i.demanded.forEach((t) => {
            const e = At(a.shift());
            0 === t.cmd.filter((t) => t === e || '*' === t).length &&
              Et(e, t.cmd, r),
              (r += 1);
          }),
            i.optional.forEach((t) => {
              if (0 === a.length) return;
              const e = At(a.shift());
              0 === t.cmd.filter((t) => t === e || '*' === t).length &&
                Et(e, t.cmd, r),
                (r += 1);
            });
        } catch (t) {
          console.warn(t.stack);
        }
      }
      function At(t) {
        return Array.isArray(t) ? 'array' : null === t ? 'null' : typeof t;
      }
      function Et(t, e, n) {
        throw new ut(
          `Invalid ${Ct[n] || 'manyith'} argument. Expected ${e.join(
            ' or '
          )} but received ${t}.`
        );
      }
      class kt {
        constructor(t) {
          (this.globalMiddleware = []), (this.frozens = []), (this.yargs = t);
        }
        addMiddleware(t, e, n = !0, r = !1) {
          if (
            (jt(
              '<array|function> [boolean] [boolean] [boolean]',
              [t, e, n],
              arguments.length
            ),
            Array.isArray(t))
          ) {
            for (let r = 0; r < t.length; r++) {
              if ('function' != typeof t[r])
                throw Error('middleware must be a function');
              const i = t[r];
              (i.applyBeforeValidation = e), (i.global = n);
            }
            Array.prototype.push.apply(this.globalMiddleware, t);
          } else if ('function' == typeof t) {
            const i = t;
            (i.applyBeforeValidation = e),
              (i.global = n),
              (i.mutates = r),
              this.globalMiddleware.push(t);
          }
          return this.yargs;
        }
        addCoerceMiddleware(t, e) {
          const n = this.yargs.getAliases();
          return (
            (this.globalMiddleware = this.globalMiddleware.filter((t) => {
              const r = [...(n[e] || []), e];
              return !t.option || !r.includes(t.option);
            })),
            (t.option = e),
            this.addMiddleware(t, !0, !0, !0)
          );
        }
        getMiddleware() {
          return this.globalMiddleware;
        }
        freeze() {
          this.frozens.push([...this.globalMiddleware]);
        }
        unfreeze() {
          const t = this.frozens.pop();
          void 0 !== t && (this.globalMiddleware = t);
        }
        reset() {
          this.globalMiddleware = this.globalMiddleware.filter((t) => t.global);
        }
      }
      function xt(t, e, n, r) {
        return n.reduce((t, n) => {
          if (n.applyBeforeValidation !== r) return t;
          if (n.mutates) {
            if (n.applied) return t;
            n.applied = !0;
          }
          if (Ot(t))
            return t
              .then((t) => Promise.all([t, n(t, e)]))
              .then(([t, e]) => Object.assign(t, e));
          {
            const r = n(t, e);
            return Ot(r)
              ? r.then((e) => Object.assign(t, e))
              : Object.assign(t, r);
          }
        }, t);
      }
      function St(
        t,
        e,
        n = (t) => {
          throw t;
        }
      ) {
        try {
          const n = 'function' == typeof t ? t() : t;
          return Ot(n) ? n.then((t) => e(t)) : e(n);
        } catch (t) {
          return n(t);
        }
      }
      const Tt = /(^\*)|(^\$0)/;
      class Mt {
        constructor(t, e, n, r) {
          (this.requireCache = new Set()),
            (this.handlers = {}),
            (this.aliasMap = {}),
            (this.frozens = []),
            (this.shim = r),
            (this.usage = t),
            (this.globalMiddleware = n),
            (this.validation = e);
        }
        addDirectory(t, e, n, r) {
          'boolean' != typeof (r = r || {}).recurse && (r.recurse = !1),
            Array.isArray(r.extensions) || (r.extensions = ['js']);
          const i = 'function' == typeof r.visit ? r.visit : (t) => t;
          (r.visit = (t, e, n) => {
            const r = i(t, e, n);
            if (r) {
              if (this.requireCache.has(e)) return r;
              this.requireCache.add(e), this.addHandler(r);
            }
            return r;
          }),
            this.shim.requireDirectory({ require: e, filename: n }, t, r);
        }
        addHandler(t, e, n, r, i, o) {
          let s = [];
          const a = (function (t) {
            return t ? t.map((t) => ((t.applyBeforeValidation = !1), t)) : [];
          })(i);
          if (((r = r || (() => {})), Array.isArray(t)))
            if (
              (function (t) {
                return t.every((t) => 'string' == typeof t);
              })(t)
            )
              [t, ...s] = t;
            else for (const e of t) this.addHandler(e);
          else {
            if (
              (function (t) {
                return 'object' == typeof t && !Array.isArray(t);
              })(t)
            ) {
              let e =
                Array.isArray(t.command) || 'string' == typeof t.command
                  ? t.command
                  : this.moduleName(t);
              return (
                t.aliases && (e = [].concat(e).concat(t.aliases)),
                void this.addHandler(
                  e,
                  this.extractDesc(t),
                  t.builder,
                  t.handler,
                  t.middlewares,
                  t.deprecated
                )
              );
            }
            if (It(n))
              return void this.addHandler(
                [t].concat(s),
                e,
                n.builder,
                n.handler,
                n.middlewares,
                n.deprecated
              );
          }
          if ('string' == typeof t) {
            const i = _t(t);
            s = s.map((t) => _t(t).cmd);
            let c = !1;
            const u = [i.cmd]
              .concat(s)
              .filter((t) => !Tt.test(t) || ((c = !0), !1));
            0 === u.length && c && u.push('$0'),
              c &&
                ((i.cmd = u[0]), (s = u.slice(1)), (t = t.replace(Tt, i.cmd))),
              s.forEach((t) => {
                this.aliasMap[t] = i.cmd;
              }),
              !1 !== e && this.usage.command(t, e, c, s, o),
              (this.handlers[i.cmd] = {
                original: t,
                description: e,
                handler: r,
                builder: n || {},
                middlewares: a,
                deprecated: o,
                demanded: i.demanded,
                optional: i.optional,
              }),
              c && (this.defaultCommand = this.handlers[i.cmd]);
          }
        }
        getCommandHandlers() {
          return this.handlers;
        }
        getCommands() {
          return Object.keys(this.handlers).concat(Object.keys(this.aliasMap));
        }
        hasDefaultCommand() {
          return !!this.defaultCommand;
        }
        runCommand(t, e, n, r, i, o) {
          const s =
              this.handlers[t] ||
              this.handlers[this.aliasMap[t]] ||
              this.defaultCommand,
            a = e.getInternalMethods().getContext(),
            c = a.commands.slice(),
            u = !t;
          t && (a.commands.push(t), a.fullCommands.push(s.original));
          const l = this.applyBuilderUpdateUsageAndParse(
            u,
            s,
            e,
            n.aliases,
            c,
            r,
            i,
            o
          );
          return Ot(l)
            ? l.then((t) =>
                this.applyMiddlewareAndGetResult(
                  u,
                  s,
                  t.innerArgv,
                  a,
                  i,
                  t.aliases,
                  e
                )
              )
            : this.applyMiddlewareAndGetResult(
                u,
                s,
                l.innerArgv,
                a,
                i,
                l.aliases,
                e
              );
        }
        applyBuilderUpdateUsageAndParse(t, e, n, r, i, o, s, a) {
          const c = e.builder;
          let u = n;
          if (Rt(c)) {
            const l = c(n.getInternalMethods().reset(r), a);
            if (Ot(l))
              return l.then((r) => {
                var a;
                return (
                  (u =
                    (a = r) && 'function' == typeof a.getInternalMethods
                      ? r
                      : n),
                  this.parseAndUpdateUsage(t, e, u, i, o, s)
                );
              });
          } else
            (function (t) {
              return 'object' == typeof t;
            })(c) &&
              ((u = n.getInternalMethods().reset(r)),
              Object.keys(e.builder).forEach((t) => {
                u.option(t, c[t]);
              }));
          return this.parseAndUpdateUsage(t, e, u, i, o, s);
        }
        parseAndUpdateUsage(t, e, n, r, i, o) {
          t && n.getInternalMethods().getUsageInstance().unfreeze(),
            this.shouldUpdateUsage(n) &&
              n
                .getInternalMethods()
                .getUsageInstance()
                .usage(
                  this.usageFromParentCommandsCommandHandler(r, e),
                  e.description
                );
          const s = n
            .getInternalMethods()
            .runYargsParserAndExecuteCommands(null, void 0, !0, i, o);
          return Ot(s)
            ? s.then((t) => ({ aliases: n.parsed.aliases, innerArgv: t }))
            : { aliases: n.parsed.aliases, innerArgv: s };
        }
        shouldUpdateUsage(t) {
          return (
            !t.getInternalMethods().getUsageInstance().getUsageDisabled() &&
            0 === t.getInternalMethods().getUsageInstance().getUsage().length
          );
        }
        usageFromParentCommandsCommandHandler(t, e) {
          const n = Tt.test(e.original)
              ? e.original.replace(Tt, '').trim()
              : e.original,
            r = t.filter((t) => !Tt.test(t));
          return r.push(n), `$0 ${r.join(' ')}`;
        }
        applyMiddlewareAndGetResult(t, e, n, r, i, o, s) {
          let a = {};
          if (i) return n;
          s.getInternalMethods().getHasOutput() ||
            (a = this.populatePositionals(e, n, r, s));
          const c = this.globalMiddleware
            .getMiddleware()
            .slice(0)
            .concat(e.middlewares);
          if (((n = xt(n, s, c, !0)), !s.getInternalMethods().getHasOutput())) {
            const e = s
              .getInternalMethods()
              .runValidation(o, a, s.parsed.error, t);
            n = St(n, (t) => (e(t), t));
          }
          if (e.handler && !s.getInternalMethods().getHasOutput()) {
            s.getInternalMethods().setHasOutput();
            const r = !!s.getOptions().configuration['populate--'];
            s.getInternalMethods().postProcess(n, r, !1, !1),
              (n = St((n = xt(n, s, c, !1)), (t) => {
                const n = e.handler(t);
                return Ot(n) ? n.then(() => t) : t;
              })),
              t || s.getInternalMethods().getUsageInstance().cacheHelpMessage(),
              Ot(n) &&
                !s.getInternalMethods().hasParseCallback() &&
                n.catch((t) => {
                  try {
                    s.getInternalMethods().getUsageInstance().fail(null, t);
                  } catch (t) {}
                });
          }
          return t || (r.commands.pop(), r.fullCommands.pop()), n;
        }
        populatePositionals(t, e, n, r) {
          e._ = e._.slice(n.commands.length);
          const i = t.demanded.slice(0),
            o = t.optional.slice(0),
            s = {};
          for (
            this.validation.positionalCount(i.length, e._.length);
            i.length;

          ) {
            const t = i.shift();
            this.populatePositional(t, e, s);
          }
          for (; o.length; ) {
            const t = o.shift();
            this.populatePositional(t, e, s);
          }
          return (
            (e._ = n.commands.concat(e._.map((t) => '' + t))),
            this.postProcessPositionals(
              e,
              s,
              this.cmdToParseOptions(t.original),
              r
            ),
            s
          );
        }
        populatePositional(t, e, n) {
          const r = t.cmd[0];
          t.variadic
            ? (n[r] = e._.splice(0).map(String))
            : e._.length && (n[r] = [String(e._.shift())]);
        }
        cmdToParseOptions(t) {
          const e = { array: [], default: {}, alias: {}, demand: {} },
            n = _t(t);
          return (
            n.demanded.forEach((t) => {
              const [n, ...r] = t.cmd;
              t.variadic && (e.array.push(n), (e.default[n] = [])),
                (e.alias[n] = r),
                (e.demand[n] = !0);
            }),
            n.optional.forEach((t) => {
              const [n, ...r] = t.cmd;
              t.variadic && (e.array.push(n), (e.default[n] = [])),
                (e.alias[n] = r);
            }),
            e
          );
        }
        postProcessPositionals(t, e, n, r) {
          const i = Object.assign({}, r.getOptions());
          i.default = Object.assign(n.default, i.default);
          for (const t of Object.keys(n.alias))
            i.alias[t] = (i.alias[t] || []).concat(n.alias[t]);
          (i.array = i.array.concat(n.array)), (i.config = {});
          const o = [];
          if (
            (Object.keys(e).forEach((t) => {
              e[t].map((e) => {
                i.configuration['unknown-options-as-args'] && (i.key[t] = !0),
                  o.push(`--${t}`),
                  o.push(e);
              });
            }),
            !o.length)
          )
            return;
          const s = Object.assign({}, i.configuration, { 'populate--': !1 }),
            a = this.shim.Parser.detailed(
              o,
              Object.assign({}, i, { configuration: s })
            );
          if (a.error)
            r.getInternalMethods()
              .getUsageInstance()
              .fail(a.error.message, a.error);
          else {
            const n = Object.keys(e);
            Object.keys(e).forEach((t) => {
              n.push(...a.aliases[t]);
            });
            const i = r.getOptions().default;
            Object.keys(a.argv).forEach((r) => {
              n.includes(r) &&
                (e[r] || (e[r] = a.argv[r]),
                !Object.prototype.hasOwnProperty.call(i, r) &&
                Object.prototype.hasOwnProperty.call(t, r) &&
                Object.prototype.hasOwnProperty.call(a.argv, r) &&
                (Array.isArray(t[r]) || Array.isArray(a.argv[r]))
                  ? (t[r] = [].concat(t[r], a.argv[r]))
                  : (t[r] = a.argv[r]));
            });
          }
        }
        runDefaultBuilderOn(t) {
          if (!this.defaultCommand) return;
          if (this.shouldUpdateUsage(t)) {
            const e = Tt.test(this.defaultCommand.original)
              ? this.defaultCommand.original
              : this.defaultCommand.original.replace(/^[^[\]<>]*/, '$0 ');
            t.getInternalMethods()
              .getUsageInstance()
              .usage(e, this.defaultCommand.description);
          }
          const e = this.defaultCommand.builder;
          if (Rt(e)) return e(t, !0);
          It(e) ||
            Object.keys(e).forEach((n) => {
              t.option(n, e[n]);
            });
        }
        moduleName(t) {
          const e = (function (t) {
            if ('undefined' == typeof require) return null;
            for (
              let e, n = 0, r = Object.keys(require.cache);
              n < r.length;
              n++
            )
              if (((e = require.cache[r[n]]), e.exports === t)) return e;
            return null;
          })(t);
          if (!e)
            throw new Error(
              `No command name given for module: ${this.shim.inspect(t)}`
            );
          return this.commandFromFilename(e.filename);
        }
        commandFromFilename(t) {
          return this.shim.path.basename(t, this.shim.path.extname(t));
        }
        extractDesc({ describe: t, description: e, desc: n }) {
          for (const r of [t, e, n]) {
            if ('string' == typeof r || !1 === r) return r;
            vt(r, !0, this.shim);
          }
          return !1;
        }
        freeze() {
          this.frozens.push({
            handlers: this.handlers,
            aliasMap: this.aliasMap,
            defaultCommand: this.defaultCommand,
          });
        }
        unfreeze() {
          const t = this.frozens.pop();
          vt(t, void 0, this.shim),
            ({
              handlers: this.handlers,
              aliasMap: this.aliasMap,
              defaultCommand: this.defaultCommand,
            } = t);
        }
        reset() {
          return (
            (this.handlers = {}),
            (this.aliasMap = {}),
            (this.defaultCommand = void 0),
            (this.requireCache = new Set()),
            this
          );
        }
      }
      function It(t) {
        return (
          'object' == typeof t && !!t.builder && 'function' == typeof t.handler
        );
      }
      function Rt(t) {
        return 'function' == typeof t;
      }
      function Ft(t = {}, e = () => !0) {
        const n = {};
        return (
          wt(t).forEach((r) => {
            e(r, t[r]) && (n[r] = t[r]);
          }),
          n
        );
      }
      function Pt(t) {
        'undefined' != typeof process &&
          [process.stdout, process.stderr].forEach((e) => {
            const n = e;
            n._handle &&
              n.isTTY &&
              'function' == typeof n._handle.setBlocking &&
              n._handle.setBlocking(t);
          });
      }
      function Lt(t) {
        return 'boolean' == typeof t;
      }
      function Nt(t, e) {
        const n = e.y18n.__,
          r = {},
          i = [];
        r.failFn = function (t) {
          i.push(t);
        };
        let o = null,
          s = !0;
        r.showHelpOnFail = function (t = !0, e) {
          const [n, i] = 'string' == typeof t ? [!0, t] : [t, e];
          return (o = i), (s = n), r;
        };
        let a = !1;
        r.fail = function (e, n) {
          const c = t.getInternalMethods().getLoggerInstance();
          if (!i.length) {
            if (
              (t.getExitProcess() && Pt(!0),
              a ||
                ((a = !0),
                s && (t.showHelp('error'), c.error()),
                (e || n) && c.error(e || n),
                o && ((e || n) && c.error(''), c.error(o))),
              (n = n || new ut(e)),
              t.getExitProcess())
            )
              return t.exit(1);
            if (t.getInternalMethods().hasParseCallback()) return t.exit(1, n);
            throw n;
          }
          for (let t = i.length - 1; t >= 0; --t) {
            const o = i[t];
            if (Lt(o)) {
              if (n) throw n;
              if (e) throw Error(e);
            } else o(e, n, r);
          }
        };
        let c = [],
          u = !1;
        (r.usage = (t, e) =>
          null === t
            ? ((u = !0), (c = []), r)
            : ((u = !1), c.push([t, e || '']), r)),
          (r.getUsage = () => c),
          (r.getUsageDisabled = () => u),
          (r.getPositionalGroupName = () => n('Positionals:'));
        let l = [];
        r.example = (t, e) => {
          l.push([t, e || '']);
        };
        let f = [];
        (r.command = function (t, e, n, r, i = !1) {
          n && (f = f.map((t) => ((t[2] = !1), t))),
            f.push([t, e || '', n, r, i]);
        }),
          (r.getCommands = () => f);
        let h = {};
        (r.describe = function (t, e) {
          Array.isArray(t)
            ? t.forEach((t) => {
                r.describe(t, e);
              })
            : 'object' == typeof t
            ? Object.keys(t).forEach((e) => {
                r.describe(e, t[e]);
              })
            : (h[t] = e);
        }),
          (r.getDescriptions = () => h);
        let p = [];
        r.epilog = (t) => {
          p.push(t);
        };
        let d,
          g = !1;
        r.wrap = (t) => {
          (g = !0), (d = t);
        };
        const m = '__yargsString__:';
        function y(t, n, r) {
          let i = 0;
          return (
            Array.isArray(t) || (t = Object.values(t).map((t) => [t])),
            t.forEach((t) => {
              i = Math.max(
                e.stringWidth(r ? `${r} ${Wt(t[0])}` : Wt(t[0])) + $t(t[0]),
                i
              );
            }),
            n && (i = Math.min(i, parseInt((0.5 * n).toString(), 10))),
            i
          );
        }
        let v;
        function b(e) {
          return (
            t.getOptions().hiddenOptions.indexOf(e) < 0 ||
            t.parsed.argv[t.getOptions().showHiddenOpt]
          );
        }
        function w(t, e) {
          let r = `[${n('default:')} `;
          if (void 0 === t && !e) return null;
          if (e) r += e;
          else
            switch (typeof t) {
              case 'string':
                r += `"${t}"`;
                break;
              case 'object':
                r += JSON.stringify(t);
                break;
              default:
                r += t;
            }
          return `${r}]`;
        }
        (r.deferY18nLookup = (t) => m + t),
          (r.help = function () {
            if (v) return v;
            !(function () {
              const e = t.getDemandedOptions(),
                n = t.getOptions();
              (Object.keys(n.alias) || []).forEach((i) => {
                n.alias[i].forEach((o) => {
                  h[o] && r.describe(i, h[o]),
                    o in e && t.demandOption(i, e[o]),
                    n.boolean.includes(o) && t.boolean(i),
                    n.count.includes(o) && t.count(i),
                    n.string.includes(o) && t.string(i),
                    n.normalize.includes(o) && t.normalize(i),
                    n.array.includes(o) && t.array(i),
                    n.number.includes(o) && t.number(i);
                });
              });
            })();
            const i = t.customScriptName ? t.$0 : e.path.basename(t.$0),
              o = t.getDemandedOptions(),
              s = t.getDemandedCommands(),
              a = t.getDeprecatedOptions(),
              O = t.getGroups(),
              _ = t.getOptions();
            let C = [];
            (C = C.concat(Object.keys(h))),
              (C = C.concat(Object.keys(o))),
              (C = C.concat(Object.keys(s))),
              (C = C.concat(Object.keys(_.default))),
              (C = C.filter(b)),
              (C = Object.keys(
                C.reduce((t, e) => ('_' !== e && (t[e] = !0), t), {})
              ));
            const j =
                (g ||
                  ((d = e.process.stdColumns
                    ? Math.min(80, e.process.stdColumns)
                    : 80),
                  (g = !0)),
                d),
              A = e.cliui({ width: j, wrap: !!j });
            if (!u)
              if (c.length)
                c.forEach((t) => {
                  A.div({ text: `${t[0].replace(/\$0/g, i)}` }),
                    t[1] && A.div({ text: `${t[1]}`, padding: [1, 0, 0, 0] });
                }),
                  A.div();
              else if (f.length) {
                let t = null;
                (t = s._
                  ? `${i} <${n('command')}>\n`
                  : `${i} [${n('command')}]\n`),
                  A.div(`${t}`);
              }
            if (f.length > 1 || (1 === f.length && !f[0][2])) {
              A.div(n('Commands:'));
              const e = t.getInternalMethods().getContext(),
                r = e.commands.length ? `${e.commands.join(' ')} ` : '';
              !0 ===
                t.getInternalMethods().getParserConfiguration()[
                  'sort-commands'
                ] && (f = f.sort((t, e) => t[0].localeCompare(e[0])));
              const o = i ? `${i} ` : '';
              f.forEach((t) => {
                const e = `${o}${r}${t[0].replace(/^\$0 ?/, '')}`;
                A.span(
                  {
                    text: e,
                    padding: [0, 2, 0, 2],
                    width: y(f, j, `${i}${r}`) + 4,
                  },
                  { text: t[1] }
                );
                const s = [];
                t[2] && s.push(`[${n('default')}]`),
                  t[3] &&
                    t[3].length &&
                    s.push(`[${n('aliases:')} ${t[3].join(', ')}]`),
                  t[4] &&
                    ('string' == typeof t[4]
                      ? s.push(`[${n('deprecated: %s', t[4])}]`)
                      : s.push(`[${n('deprecated')}]`)),
                  s.length
                    ? A.div({
                        text: s.join(' '),
                        padding: [0, 0, 0, 2],
                        align: 'right',
                      })
                    : A.div();
              }),
                A.div();
            }
            const E = (Object.keys(_.alias) || []).concat(
              Object.keys(t.parsed.newAliases) || []
            );
            C = C.filter(
              (e) =>
                !t.parsed.newAliases[e] &&
                E.every((t) => -1 === (_.alias[t] || []).indexOf(e))
            );
            const k = n('Options:');
            O[k] || (O[k] = []),
              (function (t, e, n, r) {
                let i = [],
                  o = null;
                Object.keys(n).forEach((t) => {
                  i = i.concat(n[t]);
                }),
                  t.forEach((t) => {
                    (o = [t].concat(e[t])),
                      o.some((t) => -1 !== i.indexOf(t)) || n[r].push(t);
                  });
              })(C, _.alias, O, k);
            const x = (t) => /^--/.test(Wt(t)),
              S = Object.keys(O)
                .filter((t) => O[t].length > 0)
                .map((t) => ({
                  groupName: t,
                  normalizedKeys: O[t].filter(b).map((t) => {
                    if (E.includes(t)) return t;
                    for (let e, n = 0; void 0 !== (e = E[n]); n++)
                      if ((_.alias[e] || []).includes(t)) return e;
                    return t;
                  }),
                }))
                .filter(({ normalizedKeys: t }) => t.length > 0)
                .map(({ groupName: t, normalizedKeys: e }) => {
                  const n = e.reduce(
                    (e, n) => (
                      (e[n] = [n]
                        .concat(_.alias[n] || [])
                        .map((e) =>
                          t === r.getPositionalGroupName()
                            ? e
                            : (/^[0-9]$/.test(e)
                                ? _.boolean.includes(n)
                                  ? '-'
                                  : '--'
                                : e.length > 1
                                ? '--'
                                : '-') + e
                        )
                        .sort((t, e) => (x(t) === x(e) ? 0 : x(t) ? 1 : -1))
                        .join(', ')),
                      e
                    ),
                    {}
                  );
                  return { groupName: t, normalizedKeys: e, switches: n };
                });
            if (
              (S.filter(
                ({ groupName: t }) => t !== r.getPositionalGroupName()
              ).some(
                ({ normalizedKeys: t, switches: e }) => !t.every((t) => x(e[t]))
              ) &&
                S.filter(
                  ({ groupName: t }) => t !== r.getPositionalGroupName()
                ).forEach(({ normalizedKeys: t, switches: e }) => {
                  t.forEach((t) => {
                    var n, r;
                    x(e[t]) &&
                      (e[t] =
                        ((n = e[t]),
                        (r = '-x, '.length),
                        Ut(n)
                          ? { text: n.text, indentation: n.indentation + r }
                          : { text: n, indentation: r }));
                  });
                }),
              S.forEach(({ groupName: t, normalizedKeys: e, switches: i }) => {
                A.div(t),
                  e.forEach((t) => {
                    const e = i[t];
                    let s = h[t] || '',
                      c = null;
                    s.includes(m) && (s = n(s.substring(m.length))),
                      _.boolean.includes(t) && (c = `[${n('boolean')}]`),
                      _.count.includes(t) && (c = `[${n('count')}]`),
                      _.string.includes(t) && (c = `[${n('string')}]`),
                      _.normalize.includes(t) && (c = `[${n('string')}]`),
                      _.array.includes(t) && (c = `[${n('array')}]`),
                      _.number.includes(t) && (c = `[${n('number')}]`);
                    const u = [
                      t in a
                        ? ((l = a[t]),
                          'string' == typeof l
                            ? `[${n('deprecated: %s', l)}]`
                            : `[${n('deprecated')}]`)
                        : null,
                      c,
                      t in o ? `[${n('required')}]` : null,
                      _.choices && _.choices[t]
                        ? `[${n('choices:')} ${r.stringifiedValues(
                            _.choices[t]
                          )}]`
                        : null,
                      w(_.default[t], _.defaultDescription[t]),
                    ]
                      .filter(Boolean)
                      .join(' ');
                    var l;
                    A.span(
                      {
                        text: Wt(e),
                        padding: [0, 2, 0, 2 + $t(e)],
                        width: y(i, j) + 4,
                      },
                      s
                    ),
                      u
                        ? A.div({
                            text: u,
                            padding: [0, 0, 0, 2],
                            align: 'right',
                          })
                        : A.div();
                  }),
                  A.div();
              }),
              l.length &&
                (A.div(n('Examples:')),
                l.forEach((t) => {
                  t[0] = t[0].replace(/\$0/g, i);
                }),
                l.forEach((t) => {
                  '' === t[1]
                    ? A.div({ text: t[0], padding: [0, 2, 0, 2] })
                    : A.div(
                        {
                          text: t[0],
                          padding: [0, 2, 0, 2],
                          width: y(l, j) + 4,
                        },
                        { text: t[1] }
                      );
                }),
                A.div()),
              p.length > 0)
            ) {
              const t = p.map((t) => t.replace(/\$0/g, i)).join('\n');
              A.div(`${t}\n`);
            }
            return A.toString().replace(/\s*$/, '');
          }),
          (r.cacheHelpMessage = function () {
            v = this.help();
          }),
          (r.clearCachedHelpMessage = function () {
            v = void 0;
          }),
          (r.hasCachedHelpMessage = function () {
            return !!v;
          }),
          (r.showHelp = (e) => {
            const n = t.getInternalMethods().getLoggerInstance();
            e || (e = 'error'), ('function' == typeof e ? e : n[e])(r.help());
          }),
          (r.functionDescription = (t) =>
            [
              '(',
              t.name ? e.Parser.decamelize(t.name, '-') : n('generated-value'),
              ')',
            ].join('')),
          (r.stringifiedValues = function (t, e) {
            let n = '';
            const r = e || ', ',
              i = [].concat(t);
            return t && i.length
              ? (i.forEach((t) => {
                  n.length && (n += r), (n += JSON.stringify(t));
                }),
                n)
              : n;
          });
        let O = null;
        (r.version = (t) => {
          O = t;
        }),
          (r.showVersion = (e) => {
            const n = t.getInternalMethods().getLoggerInstance();
            e || (e = 'error'), ('function' == typeof e ? e : n[e])(O);
          }),
          (r.reset = function (t) {
            return (
              (o = null),
              (a = !1),
              (c = []),
              (u = !1),
              (p = []),
              (l = []),
              (f = []),
              (h = Ft(h, (e) => !t[e])),
              r
            );
          });
        const _ = [];
        return (
          (r.freeze = function () {
            _.push({
              failMessage: o,
              failureOutput: a,
              usages: c,
              usageDisabled: u,
              epilogs: p,
              examples: l,
              commands: f,
              descriptions: h,
            });
          }),
          (r.unfreeze = function () {
            const t = _.pop();
            t &&
              ({
                failMessage: o,
                failureOutput: a,
                usages: c,
                usageDisabled: u,
                epilogs: p,
                examples: l,
                commands: f,
                descriptions: h,
              } = t);
          }),
          r
        );
      }
      function Ut(t) {
        return 'object' == typeof t;
      }
      function $t(t) {
        return Ut(t) ? t.indentation : 0;
      }
      function Wt(t) {
        return Ut(t) ? t.text : t;
      }
      class Dt {
        constructor(t, e, n, r) {
          var i, o, s;
          (this.yargs = t),
            (this.usage = e),
            (this.command = n),
            (this.shim = r),
            (this.completionKey = 'get-yargs-completions'),
            (this.aliases = null),
            (this.customCompletionFunction = null),
            (this.zshShell =
              null !==
                (s =
                  (null === (i = this.shim.getEnv('SHELL')) || void 0 === i
                    ? void 0
                    : i.includes('zsh')) ||
                  (null === (o = this.shim.getEnv('ZSH_NAME')) || void 0 === o
                    ? void 0
                    : o.includes('zsh'))) &&
              void 0 !== s &&
              s);
        }
        defaultCompletion(t, e, n, r) {
          const i = this.command.getCommandHandlers();
          for (let e = 0, n = t.length; e < n; ++e)
            if (i[t[e]] && i[t[e]].builder) {
              const n = i[t[e]].builder;
              if (Rt(n)) {
                const t = this.yargs.getInternalMethods().reset();
                return n(t, !0), t.argv;
              }
            }
          const o = [];
          this.commandCompletions(o, t, n),
            this.optionCompletions(o, t, e, n),
            this.choicesCompletions(o, t, e, n),
            r(null, o);
        }
        commandCompletions(t, e, n) {
          const r = this.yargs.getInternalMethods().getContext().commands;
          n.match(/^-/) ||
            r[r.length - 1] === n ||
            this.previousArgHasChoices(e) ||
            this.usage.getCommands().forEach((n) => {
              const r = _t(n[0]).cmd;
              if (-1 === e.indexOf(r))
                if (this.zshShell) {
                  const e = n[1] || '';
                  t.push(r.replace(/:/g, '\\:') + ':' + e);
                } else t.push(r);
            });
        }
        optionCompletions(t, e, n, r) {
          if (
            (r.match(/^-/) || ('' === r && 0 === t.length)) &&
            !this.previousArgHasChoices(e)
          ) {
            const i = this.yargs.getOptions(),
              o =
                this.yargs.getGroups()[this.usage.getPositionalGroupName()] ||
                [];
            Object.keys(i.key).forEach((s) => {
              const a =
                !!i.configuration['boolean-negation'] && i.boolean.includes(s);
              o.includes(s) ||
                this.argsContainKey(e, n, s, a) ||
                (this.completeOptionKey(s, t, r),
                a && i.default[s] && this.completeOptionKey(`no-${s}`, t, r));
            });
          }
        }
        choicesCompletions(t, e, n, r) {
          if (this.previousArgHasChoices(e)) {
            const n = this.getPreviousArgChoices(e);
            n && n.length > 0 && t.push(...n);
          }
        }
        getPreviousArgChoices(t) {
          if (t.length < 1) return;
          let e = t[t.length - 1],
            n = '';
          if (
            (!e.startsWith('--') &&
              t.length > 1 &&
              ((n = e), (e = t[t.length - 2])),
            !e.startsWith('--'))
          )
            return;
          const r = e.replace(/-/g, ''),
            i = this.yargs.getOptions();
          return Object.keys(i.key).some((t) => t === r) &&
            Array.isArray(i.choices[r])
            ? i.choices[r].filter((t) => !n || t.startsWith(n))
            : void 0;
        }
        previousArgHasChoices(t) {
          const e = this.getPreviousArgChoices(t);
          return void 0 !== e && e.length > 0;
        }
        argsContainKey(t, e, n, r) {
          if (-1 !== t.indexOf(`--${n}`)) return !0;
          if (r && -1 !== t.indexOf(`--no-${n}`)) return !0;
          if (this.aliases)
            for (const t of this.aliases[n]) if (void 0 !== e[t]) return !0;
          return !1;
        }
        completeOptionKey(t, e, n) {
          const r = this.usage.getDescriptions(),
            i = !/^--/.test(n) && /^[^0-9]$/.test(t) ? '-' : '--';
          if (this.zshShell) {
            const n = r[t] || '';
            e.push(
              i +
                `${t.replace(/:/g, '\\:')}:${n.replace('__yargsString__:', '')}`
            );
          } else e.push(i + t);
        }
        customCompletion(t, e, n, r) {
          if (
            (vt(this.customCompletionFunction, null, this.shim),
            this.customCompletionFunction.length < 3)
          ) {
            const t = this.customCompletionFunction(n, e);
            return Ot(t)
              ? t
                  .then((t) => {
                    this.shim.process.nextTick(() => {
                      r(null, t);
                    });
                  })
                  .catch((t) => {
                    this.shim.process.nextTick(() => {
                      r(t, void 0);
                    });
                  })
              : r(null, t);
          }
          return this.customCompletionFunction.length > 3
            ? this.customCompletionFunction(
                n,
                e,
                (i = r) => this.defaultCompletion(t, e, n, i),
                (t) => {
                  r(null, t);
                }
              )
            : this.customCompletionFunction(n, e, (t) => {
                r(null, t);
              });
        }
        getCompletion(t, e) {
          const n = t.length ? t[t.length - 1] : '',
            r = this.yargs.parse(t, !0),
            i = this.customCompletionFunction
              ? (r) => this.customCompletion(t, r, n, e)
              : (r) => this.defaultCompletion(t, r, n, e);
          return Ot(r) ? r.then(i) : i(r);
        }
        generateCompletionScript(t, e) {
          let n = this.zshShell
            ? '#compdef {{app_name}}\n###-begin-{{app_name}}-completions-###\n#\n# yargs command completion script\n#\n# Installation: {{app_path}} {{completion_command}} >> ~/.zshrc\n#    or {{app_path}} {{completion_command}} >> ~/.zsh_profile on OSX.\n#\n_{{app_name}}_yargs_completions()\n{\n  local reply\n  local si=$IFS\n  IFS=$\'\n\' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" {{app_path}} --get-yargs-completions "${words[@]}"))\n  IFS=$si\n  _describe \'values\' reply\n}\ncompdef _{{app_name}}_yargs_completions {{app_name}}\n###-end-{{app_name}}-completions-###\n'
            : '###-begin-{{app_name}}-completions-###\n#\n# yargs command completion script\n#\n# Installation: {{app_path}} {{completion_command}} >> ~/.bashrc\n#    or {{app_path}} {{completion_command}} >> ~/.bash_profile on OSX.\n#\n_{{app_name}}_yargs_completions()\n{\n    local cur_word args type_list\n\n    cur_word="${COMP_WORDS[COMP_CWORD]}"\n    args=("${COMP_WORDS[@]}")\n\n    # ask yargs to generate completions.\n    type_list=$({{app_path}} --get-yargs-completions "${args[@]}")\n\n    COMPREPLY=( $(compgen -W "${type_list}" -- ${cur_word}) )\n\n    # if no match was found, fall back to filename completion\n    if [ ${#COMPREPLY[@]} -eq 0 ]; then\n      COMPREPLY=()\n    fi\n\n    return 0\n}\ncomplete -o bashdefault -o default -F _{{app_name}}_yargs_completions {{app_name}}\n###-end-{{app_name}}-completions-###\n';
          const r = this.shim.path.basename(t);
          return (
            t.match(/\.js$/) && (t = `./${t}`),
            (n = n.replace(/{{app_name}}/g, r)),
            (n = n.replace(/{{completion_command}}/g, e)),
            n.replace(/{{app_path}}/g, t)
          );
        }
        registerFunction(t) {
          this.customCompletionFunction = t;
        }
        setParsed(t) {
          this.aliases = t.aliases;
        }
      }
      function zt(t, e) {
        if (0 === t.length) return e.length;
        if (0 === e.length) return t.length;
        const n = [];
        let r, i;
        for (r = 0; r <= e.length; r++) n[r] = [r];
        for (i = 0; i <= t.length; i++) n[0][i] = i;
        for (r = 1; r <= e.length; r++)
          for (i = 1; i <= t.length; i++)
            e.charAt(r - 1) === t.charAt(i - 1)
              ? (n[r][i] = n[r - 1][i - 1])
              : r > 1 &&
                i > 1 &&
                e.charAt(r - 2) === t.charAt(i - 1) &&
                e.charAt(r - 1) === t.charAt(i - 2)
              ? (n[r][i] = n[r - 2][i - 2] + 1)
              : (n[r][i] = Math.min(
                  n[r - 1][i - 1] + 1,
                  Math.min(n[r][i - 1] + 1, n[r - 1][i] + 1)
                ));
        return n[e.length][t.length];
      }
      const qt = ['$0', '--', '_'];
      let Bt,
        Vt = [];
      function Ht(t, e, n, r) {
        Bt = r;
        let i = {};
        if (Object.prototype.hasOwnProperty.call(t, 'extends')) {
          if ('string' != typeof t.extends) return i;
          const r = /\.json|\..*rc$/.test(t.extends);
          let o = null;
          if (r)
            o = (function (t, e) {
              return Bt.path.resolve(t, e);
            })(e, t.extends);
          else
            try {
              o = require.resolve(t.extends);
            } catch (e) {
              return t;
            }
          !(function (t) {
            if (Vt.indexOf(t) > -1)
              throw new ut(`Circular extended configurations: '${t}'.`);
          })(o),
            Vt.push(o),
            (i = r
              ? JSON.parse(Bt.readFileSync(o, 'utf8'))
              : require(t.extends)),
            delete t.extends,
            (i = Ht(i, Bt.path.dirname(o), n, Bt));
        }
        return (Vt = []), n ? Kt(i, t) : Object.assign({}, i, t);
      }
      function Kt(t, e) {
        const n = {};
        function r(t) {
          return t && 'object' == typeof t && !Array.isArray(t);
        }
        Object.assign(n, t);
        for (const i of Object.keys(e))
          r(e[i]) && r(n[i]) ? (n[i] = Kt(t[i], e[i])) : (n[i] = e[i]);
        return n;
      }
      var Gt,
        Jt,
        Yt,
        Qt,
        Zt,
        Xt,
        te,
        ee,
        ne,
        re,
        ie,
        oe,
        se,
        ae,
        ce,
        ue,
        le,
        fe,
        he,
        pe,
        de,
        ge,
        me,
        ye,
        ve,
        be,
        we,
        Oe,
        _e,
        Ce,
        je,
        Ae,
        Ee,
        ke = function (t, e, n, r, i) {
          if ('m' === r) throw new TypeError('Private method is not writable');
          if ('a' === r && !i)
            throw new TypeError(
              'Private accessor was defined without a setter'
            );
          if ('function' == typeof e ? t !== e || !i : !e.has(t))
            throw new TypeError(
              'Cannot write private member to an object whose class did not declare it'
            );
          return 'a' === r ? i.call(t, n) : i ? (i.value = n) : e.set(t, n), n;
        },
        xe = function (t, e, n, r) {
          if ('a' === n && !r)
            throw new TypeError(
              'Private accessor was defined without a getter'
            );
          if ('function' == typeof e ? t !== e || !r : !e.has(t))
            throw new TypeError(
              'Cannot read private member from an object whose class did not declare it'
            );
          return 'm' === n ? r : 'a' === n ? r.call(t) : r ? r.value : e.get(t);
        };
      const Se = Symbol('copyDoubleDash'),
        Te = Symbol('copyDoubleDash'),
        Me = Symbol('deleteFromParserHintObject'),
        Ie = Symbol('emitWarning'),
        Re = Symbol('freeze'),
        Fe = Symbol('getDollarZero'),
        Pe = Symbol('getParserConfiguration'),
        Le = Symbol('guessLocale'),
        Ne = Symbol('guessVersion'),
        Ue = Symbol('parsePositionalNumbers'),
        $e = Symbol('pkgUp'),
        We = Symbol('populateParserHintArray'),
        De = Symbol('populateParserHintSingleValueDictionary'),
        ze = Symbol('populateParserHintArrayDictionary'),
        qe = Symbol('populateParserHintDictionary'),
        Be = Symbol('sanitizeKey'),
        Ve = Symbol('setKey'),
        He = Symbol('unfreeze'),
        Ke = Symbol('validateAsync'),
        Ge = Symbol('getCommandInstance'),
        Je = Symbol('getContext'),
        Ye = Symbol('getHasOutput'),
        Qe = Symbol('getLoggerInstance'),
        Ze = Symbol('getParseContext'),
        Xe = Symbol('getUsageInstance'),
        tn = Symbol('getValidationInstance'),
        en = Symbol('hasParseCallback'),
        nn = Symbol('postProcess'),
        rn = Symbol('rebase'),
        on = Symbol('reset'),
        sn = Symbol('runYargsParserAndExecuteCommands'),
        an = Symbol('runValidation'),
        cn = Symbol('setHasOutput'),
        un = Symbol('kTrackManuallySetKeys');
      class ln {
        constructor(t = [], e, n, r) {
          (this.customScriptName = !1),
            (this.parsed = !1),
            Gt.set(this, void 0),
            Jt.set(this, void 0),
            Yt.set(this, { commands: [], fullCommands: [] }),
            Qt.set(this, null),
            Zt.set(this, null),
            Xt.set(this, 'show-hidden'),
            te.set(this, null),
            ee.set(this, !0),
            ne.set(this, {}),
            re.set(this, !0),
            ie.set(this, []),
            oe.set(this, void 0),
            se.set(this, {}),
            ae.set(this, !1),
            ce.set(this, null),
            ue.set(this, void 0),
            le.set(this, ''),
            fe.set(this, void 0),
            he.set(this, void 0),
            pe.set(this, {}),
            de.set(this, null),
            ge.set(this, null),
            me.set(this, {}),
            ye.set(this, {}),
            ve.set(this, void 0),
            be.set(this, !1),
            we.set(this, void 0),
            Oe.set(this, !1),
            _e.set(this, !1),
            Ce.set(this, !1),
            je.set(this, void 0),
            Ae.set(this, null),
            Ee.set(this, void 0),
            ke(this, we, r, 'f'),
            ke(this, ve, t, 'f'),
            ke(this, Jt, e, 'f'),
            ke(this, he, n, 'f'),
            ke(this, oe, new kt(this), 'f'),
            (this.$0 = this[Fe]()),
            this[on](),
            ke(this, Gt, xe(this, Gt, 'f'), 'f'),
            ke(this, je, xe(this, je, 'f'), 'f'),
            ke(this, Ee, xe(this, Ee, 'f'), 'f'),
            ke(this, fe, xe(this, fe, 'f'), 'f'),
            (xe(this, fe, 'f').showHiddenOpt = xe(this, Xt, 'f')),
            ke(this, ue, this[Te](), 'f');
        }
        addHelpOpt(t, e) {
          return (
            jt('[string|boolean] [string]', [t, e], arguments.length),
            xe(this, ce, 'f') &&
              (this[Me](xe(this, ce, 'f')), ke(this, ce, null, 'f')),
            (!1 === t && void 0 === e) ||
              (ke(this, ce, 'string' == typeof t ? t : 'help', 'f'),
              this.boolean(xe(this, ce, 'f')),
              this.describe(
                xe(this, ce, 'f'),
                e || xe(this, je, 'f').deferY18nLookup('Show help')
              )),
            this
          );
        }
        help(t, e) {
          return this.addHelpOpt(t, e);
        }
        addShowHiddenOpt(t, e) {
          if (
            (jt('[string|boolean] [string]', [t, e], arguments.length),
            !1 === t && void 0 === e)
          )
            return this;
          const n = 'string' == typeof t ? t : xe(this, Xt, 'f');
          return (
            this.boolean(n),
            this.describe(
              n,
              e || xe(this, je, 'f').deferY18nLookup('Show hidden options')
            ),
            (xe(this, fe, 'f').showHiddenOpt = n),
            this
          );
        }
        showHidden(t, e) {
          return this.addShowHiddenOpt(t, e);
        }
        alias(t, e) {
          return (
            jt(
              '<object|string|array> [string|array]',
              [t, e],
              arguments.length
            ),
            this[ze](this.alias.bind(this), 'alias', t, e),
            this
          );
        }
        array(t) {
          return (
            jt('<array|string>', [t], arguments.length),
            this[We]('array', t),
            this[un](t),
            this
          );
        }
        boolean(t) {
          return (
            jt('<array|string>', [t], arguments.length),
            this[We]('boolean', t),
            this[un](t),
            this
          );
        }
        check(t, e) {
          return (
            jt('<function> [boolean]', [t, e], arguments.length),
            this.middleware(
              (e, n) =>
                St(
                  () => t(e, n.getOptions()),
                  (n) => (
                    n
                      ? ('string' == typeof n || n instanceof Error) &&
                        xe(this, je, 'f').fail(n.toString(), n)
                      : xe(this, je, 'f').fail(
                          xe(this, we, 'f').y18n.__(
                            'Argument check failed: %s',
                            t.toString()
                          )
                        ),
                    e
                  ),
                  (t) => (
                    xe(this, je, 'f').fail(
                      t.message ? t.message : t.toString(),
                      t
                    ),
                    e
                  )
                ),
              !1,
              e
            ),
            this
          );
        }
        choices(t, e) {
          return (
            jt(
              '<object|string|array> [string|array]',
              [t, e],
              arguments.length
            ),
            this[ze](this.choices.bind(this), 'choices', t, e),
            this
          );
        }
        coerce(t, e) {
          if (
            (jt('<object|string|array> [function]', [t, e], arguments.length),
            Array.isArray(t))
          ) {
            if (!e) throw new ut('coerce callback must be provided');
            for (const n of t) this.coerce(n, e);
            return this;
          }
          if ('object' == typeof t) {
            for (const e of Object.keys(t)) this.coerce(e, t[e]);
            return this;
          }
          if (!e) throw new ut('coerce callback must be provided');
          return (
            (xe(this, fe, 'f').key[t] = !0),
            xe(this, oe, 'f').addCoerceMiddleware((n, r) => {
              let i;
              return St(
                () => ((i = r.getAliases()), e(n[t])),
                (e) => {
                  if (((n[t] = e), i[t])) for (const r of i[t]) n[r] = e;
                  return n;
                },
                (t) => {
                  throw new ut(t.message);
                }
              );
            }, t),
            this
          );
        }
        conflicts(t, e) {
          return (
            jt('<string|object> [string|array]', [t, e], arguments.length),
            xe(this, Ee, 'f').conflicts(t, e),
            this
          );
        }
        config(t = 'config', e, n) {
          return (
            jt(
              '[object|string] [string|function] [function]',
              [t, e, n],
              arguments.length
            ),
            'object' != typeof t || Array.isArray(t)
              ? ('function' == typeof e && ((n = e), (e = void 0)),
                this.describe(
                  t,
                  e ||
                    xe(this, je, 'f').deferY18nLookup(
                      'Path to JSON config file'
                    )
                ),
                (Array.isArray(t) ? t : [t]).forEach((t) => {
                  xe(this, fe, 'f').config[t] = n || !0;
                }),
                this)
              : ((t = Ht(
                  t,
                  xe(this, Jt, 'f'),
                  this[Pe]()['deep-merge-config'] || !1,
                  xe(this, we, 'f')
                )),
                (xe(this, fe, 'f').configObjects = (
                  xe(this, fe, 'f').configObjects || []
                ).concat(t)),
                this)
          );
        }
        completion(t, e, n) {
          return (
            jt(
              '[string] [string|boolean|function] [function]',
              [t, e, n],
              arguments.length
            ),
            'function' == typeof e && ((n = e), (e = void 0)),
            ke(this, Zt, t || xe(this, Zt, 'f') || 'completion', 'f'),
            e || !1 === e || (e = 'generate completion script'),
            this.command(xe(this, Zt, 'f'), e),
            n && xe(this, Qt, 'f').registerFunction(n),
            this
          );
        }
        command(t, e, n, r, i, o) {
          return (
            jt(
              '<string|array|object> [string|boolean] [function|object] [function] [array] [boolean|string]',
              [t, e, n, r, i, o],
              arguments.length
            ),
            xe(this, Gt, 'f').addHandler(t, e, n, r, i, o),
            this
          );
        }
        commands(t, e, n, r, i, o) {
          return this.command(t, e, n, r, i, o);
        }
        commandDir(t, e) {
          jt('<string> [object]', [t, e], arguments.length);
          const n = xe(this, he, 'f') || xe(this, we, 'f').require;
          return (
            xe(this, Gt, 'f').addDirectory(
              t,
              n,
              xe(this, we, 'f').getCallerFile(),
              e
            ),
            this
          );
        }
        count(t) {
          return (
            jt('<array|string>', [t], arguments.length),
            this[We]('count', t),
            this[un](t),
            this
          );
        }
        default(t, e, n) {
          return (
            jt(
              '<object|string|array> [*] [string]',
              [t, e, n],
              arguments.length
            ),
            n &&
              (bt(t, xe(this, we, 'f')),
              (xe(this, fe, 'f').defaultDescription[t] = n)),
            'function' == typeof e &&
              (bt(t, xe(this, we, 'f')),
              xe(this, fe, 'f').defaultDescription[t] ||
                (xe(this, fe, 'f').defaultDescription[t] = xe(
                  this,
                  je,
                  'f'
                ).functionDescription(e)),
              (e = e.call())),
            this[De](this.default.bind(this), 'default', t, e),
            this
          );
        }
        defaults(t, e, n) {
          return this.default(t, e, n);
        }
        demandCommand(t = 1, e, n, r) {
          return (
            jt(
              '[number] [number|string] [string|null|undefined] [string|null|undefined]',
              [t, e, n, r],
              arguments.length
            ),
            'number' != typeof e && ((n = e), (e = 1 / 0)),
            this.global('_', !1),
            (xe(this, fe, 'f').demandedCommands._ = {
              min: t,
              max: e,
              minMsg: n,
              maxMsg: r,
            }),
            this
          );
        }
        demand(t, e, n) {
          return (
            Array.isArray(e)
              ? (e.forEach((t) => {
                  vt(n, !0, xe(this, we, 'f')), this.demandOption(t, n);
                }),
                (e = 1 / 0))
              : 'number' != typeof e && ((n = e), (e = 1 / 0)),
            'number' == typeof t
              ? (vt(n, !0, xe(this, we, 'f')), this.demandCommand(t, e, n, n))
              : Array.isArray(t)
              ? t.forEach((t) => {
                  vt(n, !0, xe(this, we, 'f')), this.demandOption(t, n);
                })
              : 'string' == typeof n
              ? this.demandOption(t, n)
              : (!0 !== n && void 0 !== n) || this.demandOption(t),
            this
          );
        }
        demandOption(t, e) {
          return (
            jt('<object|string|array> [string]', [t, e], arguments.length),
            this[De](this.demandOption.bind(this), 'demandedOptions', t, e),
            this
          );
        }
        deprecateOption(t, e) {
          return (
            jt('<string> [string|boolean]', [t, e], arguments.length),
            (xe(this, fe, 'f').deprecatedOptions[t] = e),
            this
          );
        }
        describe(t, e) {
          return (
            jt('<object|string|array> [string]', [t, e], arguments.length),
            this[Ve](t, !0),
            xe(this, je, 'f').describe(t, e),
            this
          );
        }
        detectLocale(t) {
          return (
            jt('<boolean>', [t], arguments.length), ke(this, ee, t, 'f'), this
          );
        }
        env(t) {
          return (
            jt('[string|boolean]', [t], arguments.length),
            !1 === t
              ? delete xe(this, fe, 'f').envPrefix
              : (xe(this, fe, 'f').envPrefix = t || ''),
            this
          );
        }
        epilogue(t) {
          return (
            jt('<string>', [t], arguments.length),
            xe(this, je, 'f').epilog(t),
            this
          );
        }
        epilog(t) {
          return this.epilogue(t);
        }
        example(t, e) {
          return (
            jt('<string|array> [string]', [t, e], arguments.length),
            Array.isArray(t)
              ? t.forEach((t) => this.example(...t))
              : xe(this, je, 'f').example(t, e),
            this
          );
        }
        exit(t, e) {
          ke(this, ae, !0, 'f'),
            ke(this, te, e, 'f'),
            xe(this, re, 'f') && xe(this, we, 'f').process.exit(t);
        }
        exitProcess(t = !0) {
          return (
            jt('[boolean]', [t], arguments.length), ke(this, re, t, 'f'), this
          );
        }
        fail(t) {
          if (
            (jt('<function|boolean>', [t], arguments.length),
            'boolean' == typeof t && !1 !== t)
          )
            throw new ut(
              "Invalid first argument. Expected function or boolean 'false'"
            );
          return xe(this, je, 'f').failFn(t), this;
        }
        getAliases() {
          return this.parsed ? this.parsed.aliases : {};
        }
        async getCompletion(t, e) {
          return (
            jt('<array> [function]', [t, e], arguments.length),
            e
              ? xe(this, Qt, 'f').getCompletion(t, e)
              : new Promise((e, n) => {
                  xe(this, Qt, 'f').getCompletion(t, (t, r) => {
                    t ? n(t) : e(r);
                  });
                })
          );
        }
        getDemandedOptions() {
          return jt([], 0), xe(this, fe, 'f').demandedOptions;
        }
        getDemandedCommands() {
          return jt([], 0), xe(this, fe, 'f').demandedCommands;
        }
        getDeprecatedOptions() {
          return jt([], 0), xe(this, fe, 'f').deprecatedOptions;
        }
        getDetectLocale() {
          return xe(this, ee, 'f');
        }
        getExitProcess() {
          return xe(this, re, 'f');
        }
        getGroups() {
          return Object.assign({}, xe(this, se, 'f'), xe(this, ye, 'f'));
        }
        getHelp() {
          if (
            (ke(this, ae, !0, 'f'), !xe(this, je, 'f').hasCachedHelpMessage())
          ) {
            if (!this.parsed) {
              const t = this[sn](xe(this, ve, 'f'), void 0, void 0, 0, !0);
              if (Ot(t)) return t.then(() => xe(this, je, 'f').help());
            }
            const t = xe(this, Gt, 'f').runDefaultBuilderOn(this);
            if (Ot(t)) return t.then(() => xe(this, je, 'f').help());
          }
          return Promise.resolve(xe(this, je, 'f').help());
        }
        getOptions() {
          return xe(this, fe, 'f');
        }
        getStrict() {
          return xe(this, Oe, 'f');
        }
        getStrictCommands() {
          return xe(this, _e, 'f');
        }
        getStrictOptions() {
          return xe(this, Ce, 'f');
        }
        global(t, e) {
          return (
            jt('<string|array> [boolean]', [t, e], arguments.length),
            (t = [].concat(t)),
            !1 !== e
              ? (xe(this, fe, 'f').local = xe(this, fe, 'f').local.filter(
                  (e) => -1 === t.indexOf(e)
                ))
              : t.forEach((t) => {
                  xe(this, fe, 'f').local.includes(t) ||
                    xe(this, fe, 'f').local.push(t);
                }),
            this
          );
        }
        group(t, e) {
          jt('<string|array> <string>', [t, e], arguments.length);
          const n = xe(this, ye, 'f')[e] || xe(this, se, 'f')[e];
          xe(this, ye, 'f')[e] && delete xe(this, ye, 'f')[e];
          const r = {};
          return (
            (xe(this, se, 'f')[e] = (n || [])
              .concat(t)
              .filter((t) => !r[t] && (r[t] = !0))),
            this
          );
        }
        hide(t) {
          return (
            jt('<string>', [t], arguments.length),
            xe(this, fe, 'f').hiddenOptions.push(t),
            this
          );
        }
        implies(t, e) {
          return (
            jt(
              '<string|object> [number|string|array]',
              [t, e],
              arguments.length
            ),
            xe(this, Ee, 'f').implies(t, e),
            this
          );
        }
        locale(t) {
          return (
            jt('[string]', [t], arguments.length),
            t
              ? (ke(this, ee, !1, 'f'),
                xe(this, we, 'f').y18n.setLocale(t),
                this)
              : (this[Le](), xe(this, we, 'f').y18n.getLocale())
          );
        }
        middleware(t, e, n) {
          return xe(this, oe, 'f').addMiddleware(t, !!e, n);
        }
        nargs(t, e) {
          return (
            jt('<string|object|array> [number]', [t, e], arguments.length),
            this[De](this.nargs.bind(this), 'narg', t, e),
            this
          );
        }
        normalize(t) {
          return (
            jt('<array|string>', [t], arguments.length),
            this[We]('normalize', t),
            this
          );
        }
        number(t) {
          return (
            jt('<array|string>', [t], arguments.length),
            this[We]('number', t),
            this[un](t),
            this
          );
        }
        option(t, e) {
          if (
            (jt('<string|object> [object]', [t, e], arguments.length),
            'object' == typeof t)
          )
            Object.keys(t).forEach((e) => {
              this.options(e, t[e]);
            });
          else {
            'object' != typeof e && (e = {}),
              this[un](t),
              !xe(this, Ae, 'f') ||
                ('version' !== t &&
                  'version' !== (null == e ? void 0 : e.alias)) ||
                this[Ie](
                  [
                    '"version" is a reserved word.',
                    'Please do one of the following:',
                    '- Disable version with `yargs.version(false)` if using "version" as an option',
                    '- Use the built-in `yargs.version` method instead (if applicable)',
                    '- Use a different option key',
                    'https://yargs.js.org/docs/#api-reference-version',
                  ].join('\n'),
                  void 0,
                  'versionWarning'
                ),
              (xe(this, fe, 'f').key[t] = !0),
              e.alias && this.alias(t, e.alias);
            const n = e.deprecate || e.deprecated;
            n && this.deprecateOption(t, n);
            const r = e.demand || e.required || e.require;
            r && this.demand(t, r),
              e.demandOption &&
                this.demandOption(
                  t,
                  'string' == typeof e.demandOption ? e.demandOption : void 0
                ),
              e.conflicts && this.conflicts(t, e.conflicts),
              'default' in e && this.default(t, e.default),
              void 0 !== e.implies && this.implies(t, e.implies),
              void 0 !== e.nargs && this.nargs(t, e.nargs),
              e.config && this.config(t, e.configParser),
              e.normalize && this.normalize(t),
              e.choices && this.choices(t, e.choices),
              e.coerce && this.coerce(t, e.coerce),
              e.group && this.group(t, e.group),
              (e.boolean || 'boolean' === e.type) &&
                (this.boolean(t), e.alias && this.boolean(e.alias)),
              (e.array || 'array' === e.type) &&
                (this.array(t), e.alias && this.array(e.alias)),
              (e.number || 'number' === e.type) &&
                (this.number(t), e.alias && this.number(e.alias)),
              (e.string || 'string' === e.type) &&
                (this.string(t), e.alias && this.string(e.alias)),
              (e.count || 'count' === e.type) && this.count(t),
              'boolean' == typeof e.global && this.global(t, e.global),
              e.defaultDescription &&
                (xe(this, fe, 'f').defaultDescription[t] =
                  e.defaultDescription),
              e.skipValidation && this.skipValidation(t);
            const i = e.describe || e.description || e.desc;
            this.describe(t, i),
              e.hidden && this.hide(t),
              e.requiresArg && this.requiresArg(t);
          }
          return this;
        }
        options(t, e) {
          return this.option(t, e);
        }
        parse(t, e, n) {
          jt(
            '[string|array] [function|boolean|object] [function]',
            [t, e, n],
            arguments.length
          ),
            this[Re](),
            void 0 === t && (t = xe(this, ve, 'f')),
            'object' == typeof e && (ke(this, ge, e, 'f'), (e = n)),
            'function' == typeof e && (ke(this, de, e, 'f'), (e = !1)),
            e || ke(this, ve, t, 'f'),
            xe(this, de, 'f') && ke(this, re, !1, 'f');
          const r = this[sn](t, !!e),
            i = this.parsed;
          return (
            xe(this, Qt, 'f').setParsed(this.parsed),
            Ot(r)
              ? r
                  .then(
                    (t) => (
                      xe(this, de, 'f') &&
                        xe(this, de, 'f').call(
                          this,
                          xe(this, te, 'f'),
                          t,
                          xe(this, le, 'f')
                        ),
                      t
                    )
                  )
                  .catch((t) => {
                    throw (
                      (xe(this, de, 'f') &&
                        xe(this, de, 'f')(
                          t,
                          this.parsed.argv,
                          xe(this, le, 'f')
                        ),
                      t)
                    );
                  })
                  .finally(() => {
                    this[He](), (this.parsed = i);
                  })
              : (xe(this, de, 'f') &&
                  xe(this, de, 'f').call(
                    this,
                    xe(this, te, 'f'),
                    r,
                    xe(this, le, 'f')
                  ),
                this[He](),
                (this.parsed = i),
                r)
          );
        }
        parseAsync(t, e, n) {
          const r = this.parse(t, e, n);
          return Ot(r) ? r : Promise.resolve(r);
        }
        parseSync(t, e, n) {
          const r = this.parse(t, e, n);
          if (Ot(r))
            throw new ut(
              '.parseSync() must not be used with asynchronous builders, handlers, or middleware'
            );
          return r;
        }
        parserConfiguration(t) {
          return (
            jt('<object>', [t], arguments.length), ke(this, pe, t, 'f'), this
          );
        }
        pkgConf(t, e) {
          jt('<string> [string]', [t, e], arguments.length);
          let n = null;
          const r = this[$e](e || xe(this, Jt, 'f'));
          return (
            r[t] &&
              'object' == typeof r[t] &&
              ((n = Ht(
                r[t],
                e || xe(this, Jt, 'f'),
                this[Pe]()['deep-merge-config'] || !1,
                xe(this, we, 'f')
              )),
              (xe(this, fe, 'f').configObjects = (
                xe(this, fe, 'f').configObjects || []
              ).concat(n))),
            this
          );
        }
        positional(t, e) {
          jt('<string> <object>', [t, e], arguments.length);
          const n = [
            'default',
            'defaultDescription',
            'implies',
            'normalize',
            'choices',
            'conflicts',
            'coerce',
            'type',
            'describe',
            'desc',
            'description',
            'alias',
          ];
          e = Ft(
            e,
            (t, e) =>
              !('type' === t && !['string', 'number', 'boolean'].includes(e)) &&
              n.includes(t)
          );
          const r = xe(this, Yt, 'f').fullCommands[
              xe(this, Yt, 'f').fullCommands.length - 1
            ],
            i = r
              ? xe(this, Gt, 'f').cmdToParseOptions(r)
              : { array: [], alias: {}, default: {}, demand: {} };
          return (
            wt(i).forEach((n) => {
              const r = i[n];
              Array.isArray(r)
                ? -1 !== r.indexOf(t) && (e[n] = !0)
                : r[t] && !(n in e) && (e[n] = r[t]);
            }),
            this.group(t, xe(this, je, 'f').getPositionalGroupName()),
            this.option(t, e)
          );
        }
        recommendCommands(t = !0) {
          return (
            jt('[boolean]', [t], arguments.length), ke(this, be, t, 'f'), this
          );
        }
        required(t, e, n) {
          return this.demand(t, e, n);
        }
        require(t, e, n) {
          return this.demand(t, e, n);
        }
        requiresArg(t) {
          return (
            jt('<array|string|object> [number]', [t], arguments.length),
            ('string' == typeof t && xe(this, fe, 'f').narg[t]) ||
              this[De](this.requiresArg.bind(this), 'narg', t, NaN),
            this
          );
        }
        showCompletionScript(t, e) {
          return (
            jt('[string] [string]', [t, e], arguments.length),
            (t = t || this.$0),
            xe(this, ue, 'f').log(
              xe(this, Qt, 'f').generateCompletionScript(
                t,
                e || xe(this, Zt, 'f') || 'completion'
              )
            ),
            this
          );
        }
        showHelp(t) {
          if (
            (jt('[string|function]', [t], arguments.length),
            ke(this, ae, !0, 'f'),
            !xe(this, je, 'f').hasCachedHelpMessage())
          ) {
            if (!this.parsed) {
              const e = this[sn](xe(this, ve, 'f'), void 0, void 0, 0, !0);
              if (Ot(e))
                return (
                  e.then(() => {
                    xe(this, je, 'f').showHelp(t);
                  }),
                  this
                );
            }
            const e = xe(this, Gt, 'f').runDefaultBuilderOn(this);
            if (Ot(e))
              return (
                e.then(() => {
                  xe(this, je, 'f').showHelp(t);
                }),
                this
              );
          }
          return xe(this, je, 'f').showHelp(t), this;
        }
        scriptName(t) {
          return (this.customScriptName = !0), (this.$0 = t), this;
        }
        showHelpOnFail(t, e) {
          return (
            jt('[boolean|string] [string]', [t, e], arguments.length),
            xe(this, je, 'f').showHelpOnFail(t, e),
            this
          );
        }
        showVersion(t) {
          return (
            jt('[string|function]', [t], arguments.length),
            xe(this, je, 'f').showVersion(t),
            this
          );
        }
        skipValidation(t) {
          return (
            jt('<array|string>', [t], arguments.length),
            this[We]('skipValidation', t),
            this
          );
        }
        strict(t) {
          return (
            jt('[boolean]', [t], arguments.length),
            ke(this, Oe, !1 !== t, 'f'),
            this
          );
        }
        strictCommands(t) {
          return (
            jt('[boolean]', [t], arguments.length),
            ke(this, _e, !1 !== t, 'f'),
            this
          );
        }
        strictOptions(t) {
          return (
            jt('[boolean]', [t], arguments.length),
            ke(this, Ce, !1 !== t, 'f'),
            this
          );
        }
        string(t) {
          return (
            jt('<array|string>', [t], arguments.length),
            this[We]('string', t),
            this[un](t),
            this
          );
        }
        terminalWidth() {
          return jt([], 0), xe(this, we, 'f').process.stdColumns;
        }
        updateLocale(t) {
          return this.updateStrings(t);
        }
        updateStrings(t) {
          return (
            jt('<object>', [t], arguments.length),
            ke(this, ee, !1, 'f'),
            xe(this, we, 'f').y18n.updateLocale(t),
            this
          );
        }
        usage(t, e, n, r) {
          if (
            (jt(
              '<string|null|undefined> [string|boolean] [function|object] [function]',
              [t, e, n, r],
              arguments.length
            ),
            void 0 !== e)
          ) {
            if ((vt(t, null, xe(this, we, 'f')), (t || '').match(/^\$0( |$)/)))
              return this.command(t, e, n, r);
            throw new ut(
              '.usage() description must start with $0 if being used as alias for .command()'
            );
          }
          return xe(this, je, 'f').usage(t), this;
        }
        version(t, e, n) {
          const r = 'version';
          if (
            (jt(
              '[boolean|string] [string] [string]',
              [t, e, n],
              arguments.length
            ),
            xe(this, Ae, 'f') &&
              (this[Me](xe(this, Ae, 'f')),
              xe(this, je, 'f').version(void 0),
              ke(this, Ae, null, 'f')),
            0 === arguments.length)
          )
            (n = this[Ne]()), (t = r);
          else if (1 === arguments.length) {
            if (!1 === t) return this;
            (n = t), (t = r);
          } else 2 === arguments.length && ((n = e), (e = void 0));
          return (
            ke(this, Ae, 'string' == typeof t ? t : r, 'f'),
            (e = e || xe(this, je, 'f').deferY18nLookup('Show version number')),
            xe(this, je, 'f').version(n || void 0),
            this.boolean(xe(this, Ae, 'f')),
            this.describe(xe(this, Ae, 'f'), e),
            this
          );
        }
        wrap(t) {
          return (
            jt('<number|null|undefined>', [t], arguments.length),
            xe(this, je, 'f').wrap(t),
            this
          );
        }
        [((Gt = new WeakMap()),
        (Jt = new WeakMap()),
        (Yt = new WeakMap()),
        (Qt = new WeakMap()),
        (Zt = new WeakMap()),
        (Xt = new WeakMap()),
        (te = new WeakMap()),
        (ee = new WeakMap()),
        (ne = new WeakMap()),
        (re = new WeakMap()),
        (ie = new WeakMap()),
        (oe = new WeakMap()),
        (se = new WeakMap()),
        (ae = new WeakMap()),
        (ce = new WeakMap()),
        (ue = new WeakMap()),
        (le = new WeakMap()),
        (fe = new WeakMap()),
        (he = new WeakMap()),
        (pe = new WeakMap()),
        (de = new WeakMap()),
        (ge = new WeakMap()),
        (me = new WeakMap()),
        (ye = new WeakMap()),
        (ve = new WeakMap()),
        (be = new WeakMap()),
        (we = new WeakMap()),
        (Oe = new WeakMap()),
        (_e = new WeakMap()),
        (Ce = new WeakMap()),
        (je = new WeakMap()),
        (Ae = new WeakMap()),
        (Ee = new WeakMap()),
        Se)](t) {
          if (!t._ || !t['--']) return t;
          t._.push.apply(t._, t['--']);
          try {
            delete t['--'];
          } catch (t) {}
          return t;
        }
        [Te]() {
          return {
            log: (...t) => {
              this[en]() || console.log(...t),
                ke(this, ae, !0, 'f'),
                xe(this, le, 'f').length &&
                  ke(this, le, xe(this, le, 'f') + '\n', 'f'),
                ke(this, le, xe(this, le, 'f') + t.join(' '), 'f');
            },
            error: (...t) => {
              this[en]() || console.error(...t),
                ke(this, ae, !0, 'f'),
                xe(this, le, 'f').length &&
                  ke(this, le, xe(this, le, 'f') + '\n', 'f'),
                ke(this, le, xe(this, le, 'f') + t.join(' '), 'f');
            },
          };
        }
        [Me](t) {
          wt(xe(this, fe, 'f')).forEach((e) => {
            if ('configObjects' === e) return;
            const n = xe(this, fe, 'f')[e];
            Array.isArray(n)
              ? n.includes(t) && n.splice(n.indexOf(t), 1)
              : 'object' == typeof n && delete n[t];
          }),
            delete xe(this, je, 'f').getDescriptions()[t];
        }
        [Ie](t, e, n) {
          xe(this, ne, 'f')[n] ||
            (xe(this, we, 'f').process.emitWarning(t, e),
            (xe(this, ne, 'f')[n] = !0));
        }
        [Re]() {
          xe(this, ie, 'f').push({
            options: xe(this, fe, 'f'),
            configObjects: xe(this, fe, 'f').configObjects.slice(0),
            exitProcess: xe(this, re, 'f'),
            groups: xe(this, se, 'f'),
            strict: xe(this, Oe, 'f'),
            strictCommands: xe(this, _e, 'f'),
            strictOptions: xe(this, Ce, 'f'),
            completionCommand: xe(this, Zt, 'f'),
            output: xe(this, le, 'f'),
            exitError: xe(this, te, 'f'),
            hasOutput: xe(this, ae, 'f'),
            parsed: this.parsed,
            parseFn: xe(this, de, 'f'),
            parseContext: xe(this, ge, 'f'),
          }),
            xe(this, je, 'f').freeze(),
            xe(this, Ee, 'f').freeze(),
            xe(this, Gt, 'f').freeze(),
            xe(this, oe, 'f').freeze();
        }
        [Fe]() {
          let t,
            e = '';
          return (
            (t = /\b(node|iojs|electron)(\.exe)?$/.test(
              xe(this, we, 'f').process.argv()[0]
            )
              ? xe(this, we, 'f').process.argv().slice(1, 2)
              : xe(this, we, 'f').process.argv().slice(0, 1)),
            (e = t
              .map((t) => {
                const e = this[rn](xe(this, Jt, 'f'), t);
                return t.match(/^(\/|([a-zA-Z]:)?\\)/) && e.length < t.length
                  ? e
                  : t;
              })
              .join(' ')
              .trim()),
            xe(this, we, 'f').getEnv('_') &&
              xe(this, we, 'f').getProcessArgvBin() ===
                xe(this, we, 'f').getEnv('_') &&
              (e = xe(this, we, 'f')
                .getEnv('_')
                .replace(
                  `${xe(this, we, 'f').path.dirname(
                    xe(this, we, 'f').process.execPath()
                  )}/`,
                  ''
                )),
            e
          );
        }
        [Pe]() {
          return xe(this, pe, 'f');
        }
        [Le]() {
          if (!xe(this, ee, 'f')) return;
          const t =
            xe(this, we, 'f').getEnv('LC_ALL') ||
            xe(this, we, 'f').getEnv('LC_MESSAGES') ||
            xe(this, we, 'f').getEnv('LANG') ||
            xe(this, we, 'f').getEnv('LANGUAGE') ||
            'en_US';
          this.locale(t.replace(/[.:].*/, ''));
        }
        [Ne]() {
          return this[$e]().version || 'unknown';
        }
        [Ue](t) {
          const e = t['--'] ? t['--'] : t._;
          for (let t, n = 0; void 0 !== (t = e[n]); n++)
            xe(this, we, 'f').Parser.looksLikeNumber(t) &&
              Number.isSafeInteger(Math.floor(parseFloat(`${t}`))) &&
              (e[n] = Number(t));
          return t;
        }
        [$e](t) {
          const e = t || '*';
          if (xe(this, me, 'f')[e]) return xe(this, me, 'f')[e];
          let n = {};
          try {
            let e = t || xe(this, we, 'f').mainFilename;
            !t &&
              xe(this, we, 'f').path.extname(e) &&
              (e = xe(this, we, 'f').path.dirname(e));
            const r = xe(this, we, 'f').findUp(e, (t, e) =>
              e.includes('package.json') ? 'package.json' : void 0
            );
            vt(r, void 0, xe(this, we, 'f')),
              (n = JSON.parse(xe(this, we, 'f').readFileSync(r, 'utf8')));
          } catch (t) {}
          return (xe(this, me, 'f')[e] = n || {}), xe(this, me, 'f')[e];
        }
        [We](t, e) {
          (e = [].concat(e)).forEach((e) => {
            (e = this[Be](e)), xe(this, fe, 'f')[t].push(e);
          });
        }
        [De](t, e, n, r) {
          this[qe](t, e, n, r, (t, e, n) => {
            xe(this, fe, 'f')[t][e] = n;
          });
        }
        [ze](t, e, n, r) {
          this[qe](t, e, n, r, (t, e, n) => {
            xe(this, fe, 'f')[t][e] = (xe(this, fe, 'f')[t][e] || []).concat(n);
          });
        }
        [qe](t, e, n, r, i) {
          if (Array.isArray(n))
            n.forEach((e) => {
              t(e, r);
            });
          else if (((t) => 'object' == typeof t)(n))
            for (const e of wt(n)) t(e, n[e]);
          else i(e, this[Be](n), r);
        }
        [Be](t) {
          return '__proto__' === t ? '___proto___' : t;
        }
        [Ve](t, e) {
          return this[De](this[Ve].bind(this), 'key', t, e), this;
        }
        [He]() {
          var t, e, n, r, i, o, s, a, c, u, l, f;
          const h = xe(this, ie, 'f').pop();
          let p;
          vt(h, void 0, xe(this, we, 'f')),
            (t = this),
            (e = this),
            (n = this),
            (r = this),
            (i = this),
            (o = this),
            (s = this),
            (a = this),
            (c = this),
            (u = this),
            (l = this),
            (f = this),
            ({
              options: {
                set value(e) {
                  ke(t, fe, e, 'f');
                },
              }.value,
              configObjects: p,
              exitProcess: {
                set value(t) {
                  ke(e, re, t, 'f');
                },
              }.value,
              groups: {
                set value(t) {
                  ke(n, se, t, 'f');
                },
              }.value,
              output: {
                set value(t) {
                  ke(r, le, t, 'f');
                },
              }.value,
              exitError: {
                set value(t) {
                  ke(i, te, t, 'f');
                },
              }.value,
              hasOutput: {
                set value(t) {
                  ke(o, ae, t, 'f');
                },
              }.value,
              parsed: this.parsed,
              strict: {
                set value(t) {
                  ke(s, Oe, t, 'f');
                },
              }.value,
              strictCommands: {
                set value(t) {
                  ke(a, _e, t, 'f');
                },
              }.value,
              strictOptions: {
                set value(t) {
                  ke(c, Ce, t, 'f');
                },
              }.value,
              completionCommand: {
                set value(t) {
                  ke(u, Zt, t, 'f');
                },
              }.value,
              parseFn: {
                set value(t) {
                  ke(l, de, t, 'f');
                },
              }.value,
              parseContext: {
                set value(t) {
                  ke(f, ge, t, 'f');
                },
              }.value,
            } = h),
            (xe(this, fe, 'f').configObjects = p),
            xe(this, je, 'f').unfreeze(),
            xe(this, Ee, 'f').unfreeze(),
            xe(this, Gt, 'f').unfreeze(),
            xe(this, oe, 'f').unfreeze();
        }
        [Ke](t, e) {
          return St(e, (e) => (t(e), e));
        }
        getInternalMethods() {
          return {
            getCommandInstance: this[Ge].bind(this),
            getContext: this[Je].bind(this),
            getHasOutput: this[Ye].bind(this),
            getLoggerInstance: this[Qe].bind(this),
            getParseContext: this[Ze].bind(this),
            getParserConfiguration: this[Pe].bind(this),
            getUsageInstance: this[Xe].bind(this),
            getValidationInstance: this[tn].bind(this),
            hasParseCallback: this[en].bind(this),
            postProcess: this[nn].bind(this),
            reset: this[on].bind(this),
            runValidation: this[an].bind(this),
            runYargsParserAndExecuteCommands: this[sn].bind(this),
            setHasOutput: this[cn].bind(this),
          };
        }
        [Ge]() {
          return xe(this, Gt, 'f');
        }
        [Je]() {
          return xe(this, Yt, 'f');
        }
        [Ye]() {
          return xe(this, ae, 'f');
        }
        [Qe]() {
          return xe(this, ue, 'f');
        }
        [Ze]() {
          return xe(this, ge, 'f') || {};
        }
        [Xe]() {
          return xe(this, je, 'f');
        }
        [tn]() {
          return xe(this, Ee, 'f');
        }
        [en]() {
          return !!xe(this, de, 'f');
        }
        [nn](t, e, n, r) {
          return (
            n ||
              Ot(t) ||
              (e || (t = this[Se](t)),
              (this[Pe]()['parse-positional-numbers'] ||
                void 0 === this[Pe]()['parse-positional-numbers']) &&
                (t = this[Ue](t)),
              r && (t = xt(t, this, xe(this, oe, 'f').getMiddleware(), !1))),
            t
          );
        }
        [on](t = {}) {
          ke(this, fe, xe(this, fe, 'f') || {}, 'f');
          const e = {};
          (e.local = xe(this, fe, 'f').local || []),
            (e.configObjects = xe(this, fe, 'f').configObjects || []);
          const n = {};
          return (
            e.local.forEach((e) => {
              (n[e] = !0),
                (t[e] || []).forEach((t) => {
                  n[t] = !0;
                });
            }),
            Object.assign(
              xe(this, ye, 'f'),
              Object.keys(xe(this, se, 'f')).reduce((t, e) => {
                const r = xe(this, se, 'f')[e].filter((t) => !(t in n));
                return r.length > 0 && (t[e] = r), t;
              }, {})
            ),
            ke(this, se, {}, 'f'),
            [
              'array',
              'boolean',
              'string',
              'skipValidation',
              'count',
              'normalize',
              'number',
              'hiddenOptions',
            ].forEach((t) => {
              e[t] = (xe(this, fe, 'f')[t] || []).filter((t) => !n[t]);
            }),
            [
              'narg',
              'key',
              'alias',
              'default',
              'defaultDescription',
              'config',
              'choices',
              'demandedOptions',
              'demandedCommands',
              'deprecatedOptions',
            ].forEach((t) => {
              e[t] = Ft(xe(this, fe, 'f')[t], (t) => !n[t]);
            }),
            (e.envPrefix = xe(this, fe, 'f').envPrefix),
            ke(this, fe, e, 'f'),
            ke(
              this,
              je,
              xe(this, je, 'f')
                ? xe(this, je, 'f').reset(n)
                : Nt(this, xe(this, we, 'f')),
              'f'
            ),
            ke(
              this,
              Ee,
              xe(this, Ee, 'f')
                ? xe(this, Ee, 'f').reset(n)
                : (function (t, e, n) {
                    const r = n.y18n.__,
                      i = n.y18n.__n,
                      o = {
                        nonOptionCount: function (n) {
                          const r = t.getDemandedCommands(),
                            o =
                              n._.length +
                              (n['--'] ? n['--'].length : 0) -
                              t.getInternalMethods().getContext().commands
                                .length;
                          r._ &&
                            (o < r._.min || o > r._.max) &&
                            (o < r._.min
                              ? void 0 !== r._.minMsg
                                ? e.fail(
                                    r._.minMsg
                                      ? r._.minMsg
                                          .replace(/\$0/g, o.toString())
                                          .replace(/\$1/, r._.min.toString())
                                      : null
                                  )
                                : e.fail(
                                    i(
                                      'Not enough non-option arguments: got %s, need at least %s',
                                      'Not enough non-option arguments: got %s, need at least %s',
                                      o,
                                      o.toString(),
                                      r._.min.toString()
                                    )
                                  )
                              : o > r._.max &&
                                (void 0 !== r._.maxMsg
                                  ? e.fail(
                                      r._.maxMsg
                                        ? r._.maxMsg
                                            .replace(/\$0/g, o.toString())
                                            .replace(/\$1/, r._.max.toString())
                                        : null
                                    )
                                  : e.fail(
                                      i(
                                        'Too many non-option arguments: got %s, maximum of %s',
                                        'Too many non-option arguments: got %s, maximum of %s',
                                        o,
                                        o.toString(),
                                        r._.max.toString()
                                      )
                                    )));
                        },
                        positionalCount: function (t, n) {
                          n < t &&
                            e.fail(
                              i(
                                'Not enough non-option arguments: got %s, need at least %s',
                                'Not enough non-option arguments: got %s, need at least %s',
                                n,
                                n + '',
                                t + ''
                              )
                            );
                        },
                        requiredArguments: function (t, n) {
                          let r = null;
                          for (const e of Object.keys(n))
                            (Object.prototype.hasOwnProperty.call(t, e) &&
                              void 0 !== t[e]) ||
                              ((r = r || {}), (r[e] = n[e]));
                          if (r) {
                            const t = [];
                            for (const e of Object.keys(r)) {
                              const n = r[e];
                              n && t.indexOf(n) < 0 && t.push(n);
                            }
                            const n = t.length ? `\n${t.join('\n')}` : '';
                            e.fail(
                              i(
                                'Missing required argument: %s',
                                'Missing required arguments: %s',
                                Object.keys(r).length,
                                Object.keys(r).join(', ') + n
                              )
                            );
                          }
                        },
                        unknownArguments: function (n, r, s, a, c = !0) {
                          var u;
                          const l = t
                              .getInternalMethods()
                              .getCommandInstance()
                              .getCommands(),
                            f = [],
                            h = t.getInternalMethods().getContext();
                          if (
                            (Object.keys(n).forEach((e) => {
                              qt.includes(e) ||
                                Object.prototype.hasOwnProperty.call(s, e) ||
                                Object.prototype.hasOwnProperty.call(
                                  t.getInternalMethods().getParseContext(),
                                  e
                                ) ||
                                o.isValidAndSomeAliasIsNotNew(e, r) ||
                                f.push(e);
                            }),
                            c &&
                              (h.commands.length > 0 || l.length > 0 || a) &&
                              n._.slice(h.commands.length).forEach((t) => {
                                l.includes('' + t) || f.push('' + t);
                              }),
                            c)
                          ) {
                            const e =
                                (null === (u = t.getDemandedCommands()._) ||
                                void 0 === u
                                  ? void 0
                                  : u.max) || 0,
                              r = h.commands.length + e;
                            r < n._.length &&
                              n._.slice(r).forEach((t) => {
                                (t = String(t)),
                                  h.commands.includes(t) ||
                                    f.includes(t) ||
                                    f.push(t);
                              });
                          }
                          f.length &&
                            e.fail(
                              i(
                                'Unknown argument: %s',
                                'Unknown arguments: %s',
                                f.length,
                                f.join(', ')
                              )
                            );
                        },
                        unknownCommands: function (n) {
                          const r = t
                              .getInternalMethods()
                              .getCommandInstance()
                              .getCommands(),
                            o = [],
                            s = t.getInternalMethods().getContext();
                          return (
                            (s.commands.length > 0 || r.length > 0) &&
                              n._.slice(s.commands.length).forEach((t) => {
                                r.includes('' + t) || o.push('' + t);
                              }),
                            o.length > 0 &&
                              (e.fail(
                                i(
                                  'Unknown command: %s',
                                  'Unknown commands: %s',
                                  o.length,
                                  o.join(', ')
                                )
                              ),
                              !0)
                          );
                        },
                        isValidAndSomeAliasIsNotNew: function (e, n) {
                          if (!Object.prototype.hasOwnProperty.call(n, e))
                            return !1;
                          const r = t.parsed.newAliases;
                          return [e, ...n[e]].some(
                            (t) =>
                              !Object.prototype.hasOwnProperty.call(r, t) ||
                              !r[e]
                          );
                        },
                        limitedChoices: function (n) {
                          const i = t.getOptions(),
                            o = {};
                          if (!Object.keys(i.choices).length) return;
                          Object.keys(n).forEach((t) => {
                            -1 === qt.indexOf(t) &&
                              Object.prototype.hasOwnProperty.call(
                                i.choices,
                                t
                              ) &&
                              [].concat(n[t]).forEach((e) => {
                                -1 === i.choices[t].indexOf(e) &&
                                  void 0 !== e &&
                                  (o[t] = (o[t] || []).concat(e));
                              });
                          });
                          const s = Object.keys(o);
                          if (!s.length) return;
                          let a = r('Invalid values:');
                          s.forEach((t) => {
                            a += `\n  ${r(
                              'Argument: %s, Given: %s, Choices: %s',
                              t,
                              e.stringifiedValues(o[t]),
                              e.stringifiedValues(i.choices[t])
                            )}`;
                          }),
                            e.fail(a);
                        },
                      };
                    let s = {};
                    function a(t, e) {
                      const n = Number(e);
                      return (
                        'number' == typeof (e = isNaN(n) ? e : n)
                          ? (e = t._.length >= e)
                          : e.match(/^--no-.+/)
                          ? ((e = e.match(/^--no-(.+)/)[1]),
                            (e = !Object.prototype.hasOwnProperty.call(t, e)))
                          : (e = Object.prototype.hasOwnProperty.call(t, e)),
                        e
                      );
                    }
                    (o.implies = function (e, r) {
                      jt(
                        '<string|object> [array|number|string]',
                        [e, r],
                        arguments.length
                      ),
                        'object' == typeof e
                          ? Object.keys(e).forEach((t) => {
                              o.implies(t, e[t]);
                            })
                          : (t.global(e),
                            s[e] || (s[e] = []),
                            Array.isArray(r)
                              ? r.forEach((t) => o.implies(e, t))
                              : (vt(r, void 0, n), s[e].push(r)));
                    }),
                      (o.getImplied = function () {
                        return s;
                      }),
                      (o.implications = function (t) {
                        const n = [];
                        if (
                          (Object.keys(s).forEach((e) => {
                            const r = e;
                            (s[e] || []).forEach((e) => {
                              let i = r;
                              const o = e;
                              (i = a(t, i)),
                                (e = a(t, e)),
                                i && !e && n.push(` ${r} -> ${o}`);
                            });
                          }),
                          n.length)
                        ) {
                          let t = `${r('Implications failed:')}\n`;
                          n.forEach((e) => {
                            t += e;
                          }),
                            e.fail(t);
                        }
                      });
                    let c = {};
                    (o.conflicts = function (e, n) {
                      jt(
                        '<string|object> [array|string]',
                        [e, n],
                        arguments.length
                      ),
                        'object' == typeof e
                          ? Object.keys(e).forEach((t) => {
                              o.conflicts(t, e[t]);
                            })
                          : (t.global(e),
                            c[e] || (c[e] = []),
                            Array.isArray(n)
                              ? n.forEach((t) => o.conflicts(e, t))
                              : c[e].push(n));
                    }),
                      (o.getConflicting = () => c),
                      (o.conflicting = function (i) {
                        Object.keys(i).forEach((t) => {
                          c[t] &&
                            c[t].forEach((n) => {
                              n &&
                                void 0 !== i[t] &&
                                void 0 !== i[n] &&
                                e.fail(
                                  r(
                                    'Arguments %s and %s are mutually exclusive',
                                    t,
                                    n
                                  )
                                );
                            });
                        }),
                          t.getInternalMethods().getParserConfiguration()[
                            'strip-dashed'
                          ] &&
                            Object.keys(c).forEach((t) => {
                              c[t].forEach((o) => {
                                o &&
                                  void 0 !== i[n.Parser.camelCase(t)] &&
                                  void 0 !== i[n.Parser.camelCase(o)] &&
                                  e.fail(
                                    r(
                                      'Arguments %s and %s are mutually exclusive',
                                      t,
                                      o
                                    )
                                  );
                              });
                            });
                      }),
                      (o.recommendCommands = function (t, n) {
                        n = n.sort((t, e) => e.length - t.length);
                        let i = null,
                          o = 1 / 0;
                        for (let e, r = 0; void 0 !== (e = n[r]); r++) {
                          const n = zt(t, e);
                          n <= 3 && n < o && ((o = n), (i = e));
                        }
                        i && e.fail(r('Did you mean %s?', i));
                      }),
                      (o.reset = function (t) {
                        return (
                          (s = Ft(s, (e) => !t[e])),
                          (c = Ft(c, (e) => !t[e])),
                          o
                        );
                      });
                    const u = [];
                    return (
                      (o.freeze = function () {
                        u.push({ implied: s, conflicting: c });
                      }),
                      (o.unfreeze = function () {
                        const t = u.pop();
                        vt(t, void 0, n), ({ implied: s, conflicting: c } = t);
                      }),
                      o
                    );
                  })(this, xe(this, je, 'f'), xe(this, we, 'f')),
              'f'
            ),
            ke(
              this,
              Gt,
              xe(this, Gt, 'f')
                ? xe(this, Gt, 'f').reset()
                : (function (t, e, n, r) {
                    return new Mt(t, e, n, r);
                  })(
                    xe(this, je, 'f'),
                    xe(this, Ee, 'f'),
                    xe(this, oe, 'f'),
                    xe(this, we, 'f')
                  ),
              'f'
            ),
            xe(this, Qt, 'f') ||
              ke(
                this,
                Qt,
                (function (t, e, n, r) {
                  return new Dt(t, e, n, r);
                })(
                  this,
                  xe(this, je, 'f'),
                  xe(this, Gt, 'f'),
                  xe(this, we, 'f')
                ),
                'f'
              ),
            xe(this, oe, 'f').reset(),
            ke(this, Zt, null, 'f'),
            ke(this, le, '', 'f'),
            ke(this, te, null, 'f'),
            ke(this, ae, !1, 'f'),
            (this.parsed = !1),
            this
          );
        }
        [rn](t, e) {
          return xe(this, we, 'f').path.relative(t, e);
        }
        [sn](t, e, n, r = 0, i = !1) {
          let o = !!n || i;
          (t = t || xe(this, ve, 'f')),
            (xe(this, fe, 'f').__ = xe(this, we, 'f').y18n.__),
            (xe(this, fe, 'f').configuration = this[Pe]());
          const s = !!xe(this, fe, 'f').configuration['populate--'],
            a = Object.assign({}, xe(this, fe, 'f').configuration, {
              'populate--': !0,
            }),
            c = xe(this, we, 'f').Parser.detailed(
              t,
              Object.assign({}, xe(this, fe, 'f'), {
                configuration: { 'parse-positional-numbers': !1, ...a },
              })
            ),
            u = Object.assign(c.argv, xe(this, ge, 'f'));
          let l;
          const f = c.aliases;
          let h = !1,
            p = !1;
          Object.keys(u).forEach((t) => {
            t === xe(this, ce, 'f') && u[t]
              ? (h = !0)
              : t === xe(this, Ae, 'f') && u[t] && (p = !0);
          }),
            (u.$0 = this.$0),
            (this.parsed = c),
            0 === r && xe(this, je, 'f').clearCachedHelpMessage();
          try {
            if ((this[Le](), e)) return this[nn](u, s, !!n, !1);
            xe(this, ce, 'f') &&
              [xe(this, ce, 'f')]
                .concat(f[xe(this, ce, 'f')] || [])
                .filter((t) => t.length > 1)
                .includes('' + u._[u._.length - 1]) &&
              (u._.pop(), (h = !0));
            const a = xe(this, Gt, 'f').getCommands(),
              d = xe(this, Qt, 'f').completionKey in u,
              g = h || d || i;
            if (u._.length) {
              if (a.length) {
                let t;
                for (let e, o = r || 0; void 0 !== u._[o]; o++) {
                  if (
                    ((e = String(u._[o])),
                    a.includes(e) && e !== xe(this, Zt, 'f'))
                  ) {
                    const t = xe(this, Gt, 'f').runCommand(
                      e,
                      this,
                      c,
                      o + 1,
                      i,
                      h || p || i
                    );
                    return this[nn](t, s, !!n, !1);
                  }
                  if (!t && e !== xe(this, Zt, 'f')) {
                    t = e;
                    break;
                  }
                }
                !xe(this, Gt, 'f').hasDefaultCommand() &&
                  xe(this, be, 'f') &&
                  t &&
                  !g &&
                  xe(this, Ee, 'f').recommendCommands(t, a);
              }
              xe(this, Zt, 'f') &&
                u._.includes(xe(this, Zt, 'f')) &&
                !d &&
                (xe(this, re, 'f') && Pt(!0),
                this.showCompletionScript(),
                this.exit(0));
            }
            if (xe(this, Gt, 'f').hasDefaultCommand() && !g) {
              const t = xe(this, Gt, 'f').runCommand(
                null,
                this,
                c,
                0,
                i,
                h || p || i
              );
              return this[nn](t, s, !!n, !1);
            }
            if (d) {
              xe(this, re, 'f') && Pt(!0);
              const e = (t = [].concat(t)).slice(
                t.indexOf(`--${xe(this, Qt, 'f').completionKey}`) + 1
              );
              return (
                xe(this, Qt, 'f').getCompletion(e, (t, e) => {
                  if (t) throw new ut(t.message);
                  (e || []).forEach((t) => {
                    xe(this, ue, 'f').log(t);
                  }),
                    this.exit(0);
                }),
                this[nn](u, !s, !!n, !1)
              );
            }
            if (
              (xe(this, ae, 'f') ||
                (h
                  ? (xe(this, re, 'f') && Pt(!0),
                    (o = !0),
                    this.showHelp('log'),
                    this.exit(0))
                  : p &&
                    (xe(this, re, 'f') && Pt(!0),
                    (o = !0),
                    xe(this, je, 'f').showVersion('log'),
                    this.exit(0))),
              !o &&
                xe(this, fe, 'f').skipValidation.length > 0 &&
                (o = Object.keys(u).some(
                  (t) =>
                    xe(this, fe, 'f').skipValidation.indexOf(t) >= 0 &&
                    !0 === u[t]
                )),
              !o)
            ) {
              if (c.error) throw new ut(c.error.message);
              if (!d) {
                const t = this[an](f, {}, c.error);
                n || (l = xt(u, this, xe(this, oe, 'f').getMiddleware(), !0)),
                  (l = this[Ke](t, null != l ? l : u)),
                  Ot(l) &&
                    !n &&
                    (l = l.then(() =>
                      xt(u, this, xe(this, oe, 'f').getMiddleware(), !1)
                    ));
              }
            }
          } catch (t) {
            if (!(t instanceof ut)) throw t;
            xe(this, je, 'f').fail(t.message, t);
          }
          return this[nn](null != l ? l : u, s, !!n, !0);
        }
        [an](t, e, n, r) {
          const i = { ...this.getDemandedOptions() };
          return (o) => {
            if (n) throw new ut(n.message);
            xe(this, Ee, 'f').nonOptionCount(o),
              xe(this, Ee, 'f').requiredArguments(o, i);
            let s = !1;
            xe(this, _e, 'f') && (s = xe(this, Ee, 'f').unknownCommands(o)),
              xe(this, Oe, 'f') && !s
                ? xe(this, Ee, 'f').unknownArguments(o, t, e, !!r)
                : xe(this, Ce, 'f') &&
                  xe(this, Ee, 'f').unknownArguments(o, t, {}, !1, !1),
              xe(this, Ee, 'f').limitedChoices(o),
              xe(this, Ee, 'f').implications(o),
              xe(this, Ee, 'f').conflicting(o);
          };
        }
        [cn]() {
          ke(this, ae, !0, 'f');
        }
        [un](t) {
          if ('string' == typeof t) xe(this, fe, 'f').key[t] = !0;
          else for (const e of t) xe(this, fe, 'f').key[e] = !0;
        }
      }
      const fn =
        ((hn = mt),
        (t = [], e = hn.process.cwd(), n) => {
          const r = new ln(t, e, n, hn);
          return (
            Object.defineProperty(r, 'argv', {
              get: () => r.parse(),
              enumerable: !0,
            }),
            r.help(),
            r.version(),
            r
          );
        });
      var hn,
        pn = function (t, e, n, r) {
          return new (n || (n = Promise))(function (i, o) {
            function s(t) {
              try {
                c(r.next(t));
              } catch (t) {
                o(t);
              }
            }
            function a(t) {
              try {
                c(r.throw(t));
              } catch (t) {
                o(t);
              }
            }
            function c(t) {
              var e;
              t.done
                ? i(t.value)
                : ((e = t.value),
                  e instanceof n
                    ? e
                    : new n(function (t) {
                        t(e);
                      })).then(s, a);
            }
            c((r = r.apply(t, e || [])).next());
          });
        };
      const dn = {
          add: (t) => (e) =>
            e.command(
              'register <file>',
              'Register an automation file',
              (t) =>
                t
                  .positional('file', {
                    demandOption: !0,
                    desc: 'File containing one automation step per line',
                    type: 'string',
                  })
                  .option('description', {
                    alias: 'd',
                    desc: 'Save a comment together with this automation',
                    type: 'string',
                  })
                  .option('label', {
                    alias: 'l',
                    desc: 'Save a label together with this automation',
                    type: 'string',
                  })
                  .option('type', {
                    alias: 't',
                    desc: 'Automation type',
                    type: 'string',
                    demandOption: !0,
                    choices: ['tiktok-fr-elections'],
                  }),
              (e) =>
                pn(void 0, void 0, void 0, function* () {
                  return (
                    (t) =>
                    ({ type: e, file: n, description: r, label: i }) =>
                      pn(void 0, void 0, void 0, function* () {
                        t.log.info('Registering automation for "%s"...', e);
                      })
                  )(t)(e);
                })
            ),
        },
        gn = dn;
      const mn = fn(((yn = process.argv), yn.slice(ct() + 1))).scriptName(
        'tktrex-automation'
      );
      var yn;
      const vn = (t) => {
          return (
            (e = void 0),
            (n = void 0),
            (i = function* () {
              gn.add(t)(mn);
              const e = mn
                .strictCommands()
                .demandCommand(1, 'Please provide a command')
                .parse();
              return Promise.resolve(e);
            }),
            new ((r = void 0) || (r = Promise))(function (t, o) {
              function s(t) {
                try {
                  c(i.next(t));
                } catch (t) {
                  o(t);
                }
              }
              function a(t) {
                try {
                  c(i.throw(t));
                } catch (t) {
                  o(t);
                }
              }
              function c(e) {
                var n;
                e.done
                  ? t(e.value)
                  : ((n = e.value),
                    n instanceof r
                      ? n
                      : new r(function (t) {
                          t(n);
                        })).then(s, a);
              }
              c((i = i.apply(e, n || [])).next());
            })
          );
          var e, n, r, i;
        },
        bn = N('tt-automation');
      bn.debug('loaded config\n%O', s),
        (0, t.pipe)(
          s,
          F.decode,
          (0, e.mapLeft)((t) => {
            bn.error('configuration errors\n%O', (0, r.Rn)(t));
          }),
          (0, e.map)((t) =>
            vn(Object.assign(Object.assign({}, t), { log: bn })).catch((t) => {
              bn.error('an error occurred\n%O', t), process.exit(1);
            })
          )
        );
    })();
})();
