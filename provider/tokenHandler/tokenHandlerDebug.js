/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "../node_modules/aes-js/index.js":
/*!***************************************!*\
  !*** ../node_modules/aes-js/index.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/*! MIT License. Copyright 2015-2018 Richard Moore <me@ricmoo.com>. See LICENSE.txt. */
(function(root) {
    "use strict";

    function checkInt(value) {
        return (parseInt(value) === value);
    }

    function checkInts(arrayish) {
        if (!checkInt(arrayish.length)) { return false; }

        for (var i = 0; i < arrayish.length; i++) {
            if (!checkInt(arrayish[i]) || arrayish[i] < 0 || arrayish[i] > 255) {
                return false;
            }
        }

        return true;
    }

    function coerceArray(arg, copy) {

        // ArrayBuffer view
        if (arg.buffer && arg.name === 'Uint8Array') {

            if (copy) {
                if (arg.slice) {
                    arg = arg.slice();
                } else {
                    arg = Array.prototype.slice.call(arg);
                }
            }

            return arg;
        }

        // It's an array; check it is a valid representation of a byte
        if (Array.isArray(arg)) {
            if (!checkInts(arg)) {
                throw new Error('Array contains invalid value: ' + arg);
            }

            return new Uint8Array(arg);
        }

        // Something else, but behaves like an array (maybe a Buffer? Arguments?)
        if (checkInt(arg.length) && checkInts(arg)) {
            return new Uint8Array(arg);
        }

        throw new Error('unsupported array-like object');
    }

    function createArray(length) {
        return new Uint8Array(length);
    }

    function copyArray(sourceArray, targetArray, targetStart, sourceStart, sourceEnd) {
        if (sourceStart != null || sourceEnd != null) {
            if (sourceArray.slice) {
                sourceArray = sourceArray.slice(sourceStart, sourceEnd);
            } else {
                sourceArray = Array.prototype.slice.call(sourceArray, sourceStart, sourceEnd);
            }
        }
        targetArray.set(sourceArray, targetStart);
    }



    var convertUtf8 = (function() {
        function toBytes(text) {
            var result = [], i = 0;
            text = encodeURI(text);
            while (i < text.length) {
                var c = text.charCodeAt(i++);

                // if it is a % sign, encode the following 2 bytes as a hex value
                if (c === 37) {
                    result.push(parseInt(text.substr(i, 2), 16))
                    i += 2;

                // otherwise, just the actual byte
                } else {
                    result.push(c)
                }
            }

            return coerceArray(result);
        }

        function fromBytes(bytes) {
            var result = [], i = 0;

            while (i < bytes.length) {
                var c = bytes[i];

                if (c < 128) {
                    result.push(String.fromCharCode(c));
                    i++;
                } else if (c > 191 && c < 224) {
                    result.push(String.fromCharCode(((c & 0x1f) << 6) | (bytes[i + 1] & 0x3f)));
                    i += 2;
                } else {
                    result.push(String.fromCharCode(((c & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)));
                    i += 3;
                }
            }

            return result.join('');
        }

        return {
            toBytes: toBytes,
            fromBytes: fromBytes,
        }
    })();

    var convertHex = (function() {
        function toBytes(text) {
            var result = [];
            for (var i = 0; i < text.length; i += 2) {
                result.push(parseInt(text.substr(i, 2), 16));
            }

            return result;
        }

        // http://ixti.net/development/javascript/2011/11/11/base64-encodedecode-of-utf8-in-browser-with-js.html
        var Hex = '0123456789abcdef';

        function fromBytes(bytes) {
                var result = [];
                for (var i = 0; i < bytes.length; i++) {
                    var v = bytes[i];
                    result.push(Hex[(v & 0xf0) >> 4] + Hex[v & 0x0f]);
                }
                return result.join('');
        }

        return {
            toBytes: toBytes,
            fromBytes: fromBytes,
        }
    })();


    // Number of rounds by keysize
    var numberOfRounds = {16: 10, 24: 12, 32: 14}

    // Round constant words
    var rcon = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d, 0x9a, 0x2f, 0x5e, 0xbc, 0x63, 0xc6, 0x97, 0x35, 0x6a, 0xd4, 0xb3, 0x7d, 0xfa, 0xef, 0xc5, 0x91];

    // S-box and Inverse S-box (S is for Substitution)
    var S = [0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76, 0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0, 0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15, 0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75, 0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84, 0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf, 0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8, 0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2, 0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73, 0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb, 0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79, 0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08, 0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a, 0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e, 0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf, 0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16];
    var Si =[0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb, 0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb, 0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e, 0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25, 0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92, 0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84, 0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06, 0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b, 0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73, 0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e, 0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b, 0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4, 0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f, 0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef, 0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61, 0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d];

    // Transformations for encryption
    var T1 = [0xc66363a5, 0xf87c7c84, 0xee777799, 0xf67b7b8d, 0xfff2f20d, 0xd66b6bbd, 0xde6f6fb1, 0x91c5c554, 0x60303050, 0x02010103, 0xce6767a9, 0x562b2b7d, 0xe7fefe19, 0xb5d7d762, 0x4dababe6, 0xec76769a, 0x8fcaca45, 0x1f82829d, 0x89c9c940, 0xfa7d7d87, 0xeffafa15, 0xb25959eb, 0x8e4747c9, 0xfbf0f00b, 0x41adadec, 0xb3d4d467, 0x5fa2a2fd, 0x45afafea, 0x239c9cbf, 0x53a4a4f7, 0xe4727296, 0x9bc0c05b, 0x75b7b7c2, 0xe1fdfd1c, 0x3d9393ae, 0x4c26266a, 0x6c36365a, 0x7e3f3f41, 0xf5f7f702, 0x83cccc4f, 0x6834345c, 0x51a5a5f4, 0xd1e5e534, 0xf9f1f108, 0xe2717193, 0xabd8d873, 0x62313153, 0x2a15153f, 0x0804040c, 0x95c7c752, 0x46232365, 0x9dc3c35e, 0x30181828, 0x379696a1, 0x0a05050f, 0x2f9a9ab5, 0x0e070709, 0x24121236, 0x1b80809b, 0xdfe2e23d, 0xcdebeb26, 0x4e272769, 0x7fb2b2cd, 0xea75759f, 0x1209091b, 0x1d83839e, 0x582c2c74, 0x341a1a2e, 0x361b1b2d, 0xdc6e6eb2, 0xb45a5aee, 0x5ba0a0fb, 0xa45252f6, 0x763b3b4d, 0xb7d6d661, 0x7db3b3ce, 0x5229297b, 0xdde3e33e, 0x5e2f2f71, 0x13848497, 0xa65353f5, 0xb9d1d168, 0x00000000, 0xc1eded2c, 0x40202060, 0xe3fcfc1f, 0x79b1b1c8, 0xb65b5bed, 0xd46a6abe, 0x8dcbcb46, 0x67bebed9, 0x7239394b, 0x944a4ade, 0x984c4cd4, 0xb05858e8, 0x85cfcf4a, 0xbbd0d06b, 0xc5efef2a, 0x4faaaae5, 0xedfbfb16, 0x864343c5, 0x9a4d4dd7, 0x66333355, 0x11858594, 0x8a4545cf, 0xe9f9f910, 0x04020206, 0xfe7f7f81, 0xa05050f0, 0x783c3c44, 0x259f9fba, 0x4ba8a8e3, 0xa25151f3, 0x5da3a3fe, 0x804040c0, 0x058f8f8a, 0x3f9292ad, 0x219d9dbc, 0x70383848, 0xf1f5f504, 0x63bcbcdf, 0x77b6b6c1, 0xafdada75, 0x42212163, 0x20101030, 0xe5ffff1a, 0xfdf3f30e, 0xbfd2d26d, 0x81cdcd4c, 0x180c0c14, 0x26131335, 0xc3ecec2f, 0xbe5f5fe1, 0x359797a2, 0x884444cc, 0x2e171739, 0x93c4c457, 0x55a7a7f2, 0xfc7e7e82, 0x7a3d3d47, 0xc86464ac, 0xba5d5de7, 0x3219192b, 0xe6737395, 0xc06060a0, 0x19818198, 0x9e4f4fd1, 0xa3dcdc7f, 0x44222266, 0x542a2a7e, 0x3b9090ab, 0x0b888883, 0x8c4646ca, 0xc7eeee29, 0x6bb8b8d3, 0x2814143c, 0xa7dede79, 0xbc5e5ee2, 0x160b0b1d, 0xaddbdb76, 0xdbe0e03b, 0x64323256, 0x743a3a4e, 0x140a0a1e, 0x924949db, 0x0c06060a, 0x4824246c, 0xb85c5ce4, 0x9fc2c25d, 0xbdd3d36e, 0x43acacef, 0xc46262a6, 0x399191a8, 0x319595a4, 0xd3e4e437, 0xf279798b, 0xd5e7e732, 0x8bc8c843, 0x6e373759, 0xda6d6db7, 0x018d8d8c, 0xb1d5d564, 0x9c4e4ed2, 0x49a9a9e0, 0xd86c6cb4, 0xac5656fa, 0xf3f4f407, 0xcfeaea25, 0xca6565af, 0xf47a7a8e, 0x47aeaee9, 0x10080818, 0x6fbabad5, 0xf0787888, 0x4a25256f, 0x5c2e2e72, 0x381c1c24, 0x57a6a6f1, 0x73b4b4c7, 0x97c6c651, 0xcbe8e823, 0xa1dddd7c, 0xe874749c, 0x3e1f1f21, 0x964b4bdd, 0x61bdbddc, 0x0d8b8b86, 0x0f8a8a85, 0xe0707090, 0x7c3e3e42, 0x71b5b5c4, 0xcc6666aa, 0x904848d8, 0x06030305, 0xf7f6f601, 0x1c0e0e12, 0xc26161a3, 0x6a35355f, 0xae5757f9, 0x69b9b9d0, 0x17868691, 0x99c1c158, 0x3a1d1d27, 0x279e9eb9, 0xd9e1e138, 0xebf8f813, 0x2b9898b3, 0x22111133, 0xd26969bb, 0xa9d9d970, 0x078e8e89, 0x339494a7, 0x2d9b9bb6, 0x3c1e1e22, 0x15878792, 0xc9e9e920, 0x87cece49, 0xaa5555ff, 0x50282878, 0xa5dfdf7a, 0x038c8c8f, 0x59a1a1f8, 0x09898980, 0x1a0d0d17, 0x65bfbfda, 0xd7e6e631, 0x844242c6, 0xd06868b8, 0x824141c3, 0x299999b0, 0x5a2d2d77, 0x1e0f0f11, 0x7bb0b0cb, 0xa85454fc, 0x6dbbbbd6, 0x2c16163a];
    var T2 = [0xa5c66363, 0x84f87c7c, 0x99ee7777, 0x8df67b7b, 0x0dfff2f2, 0xbdd66b6b, 0xb1de6f6f, 0x5491c5c5, 0x50603030, 0x03020101, 0xa9ce6767, 0x7d562b2b, 0x19e7fefe, 0x62b5d7d7, 0xe64dabab, 0x9aec7676, 0x458fcaca, 0x9d1f8282, 0x4089c9c9, 0x87fa7d7d, 0x15effafa, 0xebb25959, 0xc98e4747, 0x0bfbf0f0, 0xec41adad, 0x67b3d4d4, 0xfd5fa2a2, 0xea45afaf, 0xbf239c9c, 0xf753a4a4, 0x96e47272, 0x5b9bc0c0, 0xc275b7b7, 0x1ce1fdfd, 0xae3d9393, 0x6a4c2626, 0x5a6c3636, 0x417e3f3f, 0x02f5f7f7, 0x4f83cccc, 0x5c683434, 0xf451a5a5, 0x34d1e5e5, 0x08f9f1f1, 0x93e27171, 0x73abd8d8, 0x53623131, 0x3f2a1515, 0x0c080404, 0x5295c7c7, 0x65462323, 0x5e9dc3c3, 0x28301818, 0xa1379696, 0x0f0a0505, 0xb52f9a9a, 0x090e0707, 0x36241212, 0x9b1b8080, 0x3ddfe2e2, 0x26cdebeb, 0x694e2727, 0xcd7fb2b2, 0x9fea7575, 0x1b120909, 0x9e1d8383, 0x74582c2c, 0x2e341a1a, 0x2d361b1b, 0xb2dc6e6e, 0xeeb45a5a, 0xfb5ba0a0, 0xf6a45252, 0x4d763b3b, 0x61b7d6d6, 0xce7db3b3, 0x7b522929, 0x3edde3e3, 0x715e2f2f, 0x97138484, 0xf5a65353, 0x68b9d1d1, 0x00000000, 0x2cc1eded, 0x60402020, 0x1fe3fcfc, 0xc879b1b1, 0xedb65b5b, 0xbed46a6a, 0x468dcbcb, 0xd967bebe, 0x4b723939, 0xde944a4a, 0xd4984c4c, 0xe8b05858, 0x4a85cfcf, 0x6bbbd0d0, 0x2ac5efef, 0xe54faaaa, 0x16edfbfb, 0xc5864343, 0xd79a4d4d, 0x55663333, 0x94118585, 0xcf8a4545, 0x10e9f9f9, 0x06040202, 0x81fe7f7f, 0xf0a05050, 0x44783c3c, 0xba259f9f, 0xe34ba8a8, 0xf3a25151, 0xfe5da3a3, 0xc0804040, 0x8a058f8f, 0xad3f9292, 0xbc219d9d, 0x48703838, 0x04f1f5f5, 0xdf63bcbc, 0xc177b6b6, 0x75afdada, 0x63422121, 0x30201010, 0x1ae5ffff, 0x0efdf3f3, 0x6dbfd2d2, 0x4c81cdcd, 0x14180c0c, 0x35261313, 0x2fc3ecec, 0xe1be5f5f, 0xa2359797, 0xcc884444, 0x392e1717, 0x5793c4c4, 0xf255a7a7, 0x82fc7e7e, 0x477a3d3d, 0xacc86464, 0xe7ba5d5d, 0x2b321919, 0x95e67373, 0xa0c06060, 0x98198181, 0xd19e4f4f, 0x7fa3dcdc, 0x66442222, 0x7e542a2a, 0xab3b9090, 0x830b8888, 0xca8c4646, 0x29c7eeee, 0xd36bb8b8, 0x3c281414, 0x79a7dede, 0xe2bc5e5e, 0x1d160b0b, 0x76addbdb, 0x3bdbe0e0, 0x56643232, 0x4e743a3a, 0x1e140a0a, 0xdb924949, 0x0a0c0606, 0x6c482424, 0xe4b85c5c, 0x5d9fc2c2, 0x6ebdd3d3, 0xef43acac, 0xa6c46262, 0xa8399191, 0xa4319595, 0x37d3e4e4, 0x8bf27979, 0x32d5e7e7, 0x438bc8c8, 0x596e3737, 0xb7da6d6d, 0x8c018d8d, 0x64b1d5d5, 0xd29c4e4e, 0xe049a9a9, 0xb4d86c6c, 0xfaac5656, 0x07f3f4f4, 0x25cfeaea, 0xafca6565, 0x8ef47a7a, 0xe947aeae, 0x18100808, 0xd56fbaba, 0x88f07878, 0x6f4a2525, 0x725c2e2e, 0x24381c1c, 0xf157a6a6, 0xc773b4b4, 0x5197c6c6, 0x23cbe8e8, 0x7ca1dddd, 0x9ce87474, 0x213e1f1f, 0xdd964b4b, 0xdc61bdbd, 0x860d8b8b, 0x850f8a8a, 0x90e07070, 0x427c3e3e, 0xc471b5b5, 0xaacc6666, 0xd8904848, 0x05060303, 0x01f7f6f6, 0x121c0e0e, 0xa3c26161, 0x5f6a3535, 0xf9ae5757, 0xd069b9b9, 0x91178686, 0x5899c1c1, 0x273a1d1d, 0xb9279e9e, 0x38d9e1e1, 0x13ebf8f8, 0xb32b9898, 0x33221111, 0xbbd26969, 0x70a9d9d9, 0x89078e8e, 0xa7339494, 0xb62d9b9b, 0x223c1e1e, 0x92158787, 0x20c9e9e9, 0x4987cece, 0xffaa5555, 0x78502828, 0x7aa5dfdf, 0x8f038c8c, 0xf859a1a1, 0x80098989, 0x171a0d0d, 0xda65bfbf, 0x31d7e6e6, 0xc6844242, 0xb8d06868, 0xc3824141, 0xb0299999, 0x775a2d2d, 0x111e0f0f, 0xcb7bb0b0, 0xfca85454, 0xd66dbbbb, 0x3a2c1616];
    var T3 = [0x63a5c663, 0x7c84f87c, 0x7799ee77, 0x7b8df67b, 0xf20dfff2, 0x6bbdd66b, 0x6fb1de6f, 0xc55491c5, 0x30506030, 0x01030201, 0x67a9ce67, 0x2b7d562b, 0xfe19e7fe, 0xd762b5d7, 0xabe64dab, 0x769aec76, 0xca458fca, 0x829d1f82, 0xc94089c9, 0x7d87fa7d, 0xfa15effa, 0x59ebb259, 0x47c98e47, 0xf00bfbf0, 0xadec41ad, 0xd467b3d4, 0xa2fd5fa2, 0xafea45af, 0x9cbf239c, 0xa4f753a4, 0x7296e472, 0xc05b9bc0, 0xb7c275b7, 0xfd1ce1fd, 0x93ae3d93, 0x266a4c26, 0x365a6c36, 0x3f417e3f, 0xf702f5f7, 0xcc4f83cc, 0x345c6834, 0xa5f451a5, 0xe534d1e5, 0xf108f9f1, 0x7193e271, 0xd873abd8, 0x31536231, 0x153f2a15, 0x040c0804, 0xc75295c7, 0x23654623, 0xc35e9dc3, 0x18283018, 0x96a13796, 0x050f0a05, 0x9ab52f9a, 0x07090e07, 0x12362412, 0x809b1b80, 0xe23ddfe2, 0xeb26cdeb, 0x27694e27, 0xb2cd7fb2, 0x759fea75, 0x091b1209, 0x839e1d83, 0x2c74582c, 0x1a2e341a, 0x1b2d361b, 0x6eb2dc6e, 0x5aeeb45a, 0xa0fb5ba0, 0x52f6a452, 0x3b4d763b, 0xd661b7d6, 0xb3ce7db3, 0x297b5229, 0xe33edde3, 0x2f715e2f, 0x84971384, 0x53f5a653, 0xd168b9d1, 0x00000000, 0xed2cc1ed, 0x20604020, 0xfc1fe3fc, 0xb1c879b1, 0x5bedb65b, 0x6abed46a, 0xcb468dcb, 0xbed967be, 0x394b7239, 0x4ade944a, 0x4cd4984c, 0x58e8b058, 0xcf4a85cf, 0xd06bbbd0, 0xef2ac5ef, 0xaae54faa, 0xfb16edfb, 0x43c58643, 0x4dd79a4d, 0x33556633, 0x85941185, 0x45cf8a45, 0xf910e9f9, 0x02060402, 0x7f81fe7f, 0x50f0a050, 0x3c44783c, 0x9fba259f, 0xa8e34ba8, 0x51f3a251, 0xa3fe5da3, 0x40c08040, 0x8f8a058f, 0x92ad3f92, 0x9dbc219d, 0x38487038, 0xf504f1f5, 0xbcdf63bc, 0xb6c177b6, 0xda75afda, 0x21634221, 0x10302010, 0xff1ae5ff, 0xf30efdf3, 0xd26dbfd2, 0xcd4c81cd, 0x0c14180c, 0x13352613, 0xec2fc3ec, 0x5fe1be5f, 0x97a23597, 0x44cc8844, 0x17392e17, 0xc45793c4, 0xa7f255a7, 0x7e82fc7e, 0x3d477a3d, 0x64acc864, 0x5de7ba5d, 0x192b3219, 0x7395e673, 0x60a0c060, 0x81981981, 0x4fd19e4f, 0xdc7fa3dc, 0x22664422, 0x2a7e542a, 0x90ab3b90, 0x88830b88, 0x46ca8c46, 0xee29c7ee, 0xb8d36bb8, 0x143c2814, 0xde79a7de, 0x5ee2bc5e, 0x0b1d160b, 0xdb76addb, 0xe03bdbe0, 0x32566432, 0x3a4e743a, 0x0a1e140a, 0x49db9249, 0x060a0c06, 0x246c4824, 0x5ce4b85c, 0xc25d9fc2, 0xd36ebdd3, 0xacef43ac, 0x62a6c462, 0x91a83991, 0x95a43195, 0xe437d3e4, 0x798bf279, 0xe732d5e7, 0xc8438bc8, 0x37596e37, 0x6db7da6d, 0x8d8c018d, 0xd564b1d5, 0x4ed29c4e, 0xa9e049a9, 0x6cb4d86c, 0x56faac56, 0xf407f3f4, 0xea25cfea, 0x65afca65, 0x7a8ef47a, 0xaee947ae, 0x08181008, 0xbad56fba, 0x7888f078, 0x256f4a25, 0x2e725c2e, 0x1c24381c, 0xa6f157a6, 0xb4c773b4, 0xc65197c6, 0xe823cbe8, 0xdd7ca1dd, 0x749ce874, 0x1f213e1f, 0x4bdd964b, 0xbddc61bd, 0x8b860d8b, 0x8a850f8a, 0x7090e070, 0x3e427c3e, 0xb5c471b5, 0x66aacc66, 0x48d89048, 0x03050603, 0xf601f7f6, 0x0e121c0e, 0x61a3c261, 0x355f6a35, 0x57f9ae57, 0xb9d069b9, 0x86911786, 0xc15899c1, 0x1d273a1d, 0x9eb9279e, 0xe138d9e1, 0xf813ebf8, 0x98b32b98, 0x11332211, 0x69bbd269, 0xd970a9d9, 0x8e89078e, 0x94a73394, 0x9bb62d9b, 0x1e223c1e, 0x87921587, 0xe920c9e9, 0xce4987ce, 0x55ffaa55, 0x28785028, 0xdf7aa5df, 0x8c8f038c, 0xa1f859a1, 0x89800989, 0x0d171a0d, 0xbfda65bf, 0xe631d7e6, 0x42c68442, 0x68b8d068, 0x41c38241, 0x99b02999, 0x2d775a2d, 0x0f111e0f, 0xb0cb7bb0, 0x54fca854, 0xbbd66dbb, 0x163a2c16];
    var T4 = [0x6363a5c6, 0x7c7c84f8, 0x777799ee, 0x7b7b8df6, 0xf2f20dff, 0x6b6bbdd6, 0x6f6fb1de, 0xc5c55491, 0x30305060, 0x01010302, 0x6767a9ce, 0x2b2b7d56, 0xfefe19e7, 0xd7d762b5, 0xababe64d, 0x76769aec, 0xcaca458f, 0x82829d1f, 0xc9c94089, 0x7d7d87fa, 0xfafa15ef, 0x5959ebb2, 0x4747c98e, 0xf0f00bfb, 0xadadec41, 0xd4d467b3, 0xa2a2fd5f, 0xafafea45, 0x9c9cbf23, 0xa4a4f753, 0x727296e4, 0xc0c05b9b, 0xb7b7c275, 0xfdfd1ce1, 0x9393ae3d, 0x26266a4c, 0x36365a6c, 0x3f3f417e, 0xf7f702f5, 0xcccc4f83, 0x34345c68, 0xa5a5f451, 0xe5e534d1, 0xf1f108f9, 0x717193e2, 0xd8d873ab, 0x31315362, 0x15153f2a, 0x04040c08, 0xc7c75295, 0x23236546, 0xc3c35e9d, 0x18182830, 0x9696a137, 0x05050f0a, 0x9a9ab52f, 0x0707090e, 0x12123624, 0x80809b1b, 0xe2e23ddf, 0xebeb26cd, 0x2727694e, 0xb2b2cd7f, 0x75759fea, 0x09091b12, 0x83839e1d, 0x2c2c7458, 0x1a1a2e34, 0x1b1b2d36, 0x6e6eb2dc, 0x5a5aeeb4, 0xa0a0fb5b, 0x5252f6a4, 0x3b3b4d76, 0xd6d661b7, 0xb3b3ce7d, 0x29297b52, 0xe3e33edd, 0x2f2f715e, 0x84849713, 0x5353f5a6, 0xd1d168b9, 0x00000000, 0xeded2cc1, 0x20206040, 0xfcfc1fe3, 0xb1b1c879, 0x5b5bedb6, 0x6a6abed4, 0xcbcb468d, 0xbebed967, 0x39394b72, 0x4a4ade94, 0x4c4cd498, 0x5858e8b0, 0xcfcf4a85, 0xd0d06bbb, 0xefef2ac5, 0xaaaae54f, 0xfbfb16ed, 0x4343c586, 0x4d4dd79a, 0x33335566, 0x85859411, 0x4545cf8a, 0xf9f910e9, 0x02020604, 0x7f7f81fe, 0x5050f0a0, 0x3c3c4478, 0x9f9fba25, 0xa8a8e34b, 0x5151f3a2, 0xa3a3fe5d, 0x4040c080, 0x8f8f8a05, 0x9292ad3f, 0x9d9dbc21, 0x38384870, 0xf5f504f1, 0xbcbcdf63, 0xb6b6c177, 0xdada75af, 0x21216342, 0x10103020, 0xffff1ae5, 0xf3f30efd, 0xd2d26dbf, 0xcdcd4c81, 0x0c0c1418, 0x13133526, 0xecec2fc3, 0x5f5fe1be, 0x9797a235, 0x4444cc88, 0x1717392e, 0xc4c45793, 0xa7a7f255, 0x7e7e82fc, 0x3d3d477a, 0x6464acc8, 0x5d5de7ba, 0x19192b32, 0x737395e6, 0x6060a0c0, 0x81819819, 0x4f4fd19e, 0xdcdc7fa3, 0x22226644, 0x2a2a7e54, 0x9090ab3b, 0x8888830b, 0x4646ca8c, 0xeeee29c7, 0xb8b8d36b, 0x14143c28, 0xdede79a7, 0x5e5ee2bc, 0x0b0b1d16, 0xdbdb76ad, 0xe0e03bdb, 0x32325664, 0x3a3a4e74, 0x0a0a1e14, 0x4949db92, 0x06060a0c, 0x24246c48, 0x5c5ce4b8, 0xc2c25d9f, 0xd3d36ebd, 0xacacef43, 0x6262a6c4, 0x9191a839, 0x9595a431, 0xe4e437d3, 0x79798bf2, 0xe7e732d5, 0xc8c8438b, 0x3737596e, 0x6d6db7da, 0x8d8d8c01, 0xd5d564b1, 0x4e4ed29c, 0xa9a9e049, 0x6c6cb4d8, 0x5656faac, 0xf4f407f3, 0xeaea25cf, 0x6565afca, 0x7a7a8ef4, 0xaeaee947, 0x08081810, 0xbabad56f, 0x787888f0, 0x25256f4a, 0x2e2e725c, 0x1c1c2438, 0xa6a6f157, 0xb4b4c773, 0xc6c65197, 0xe8e823cb, 0xdddd7ca1, 0x74749ce8, 0x1f1f213e, 0x4b4bdd96, 0xbdbddc61, 0x8b8b860d, 0x8a8a850f, 0x707090e0, 0x3e3e427c, 0xb5b5c471, 0x6666aacc, 0x4848d890, 0x03030506, 0xf6f601f7, 0x0e0e121c, 0x6161a3c2, 0x35355f6a, 0x5757f9ae, 0xb9b9d069, 0x86869117, 0xc1c15899, 0x1d1d273a, 0x9e9eb927, 0xe1e138d9, 0xf8f813eb, 0x9898b32b, 0x11113322, 0x6969bbd2, 0xd9d970a9, 0x8e8e8907, 0x9494a733, 0x9b9bb62d, 0x1e1e223c, 0x87879215, 0xe9e920c9, 0xcece4987, 0x5555ffaa, 0x28287850, 0xdfdf7aa5, 0x8c8c8f03, 0xa1a1f859, 0x89898009, 0x0d0d171a, 0xbfbfda65, 0xe6e631d7, 0x4242c684, 0x6868b8d0, 0x4141c382, 0x9999b029, 0x2d2d775a, 0x0f0f111e, 0xb0b0cb7b, 0x5454fca8, 0xbbbbd66d, 0x16163a2c];

    // Transformations for decryption
    var T5 = [0x51f4a750, 0x7e416553, 0x1a17a4c3, 0x3a275e96, 0x3bab6bcb, 0x1f9d45f1, 0xacfa58ab, 0x4be30393, 0x2030fa55, 0xad766df6, 0x88cc7691, 0xf5024c25, 0x4fe5d7fc, 0xc52acbd7, 0x26354480, 0xb562a38f, 0xdeb15a49, 0x25ba1b67, 0x45ea0e98, 0x5dfec0e1, 0xc32f7502, 0x814cf012, 0x8d4697a3, 0x6bd3f9c6, 0x038f5fe7, 0x15929c95, 0xbf6d7aeb, 0x955259da, 0xd4be832d, 0x587421d3, 0x49e06929, 0x8ec9c844, 0x75c2896a, 0xf48e7978, 0x99583e6b, 0x27b971dd, 0xbee14fb6, 0xf088ad17, 0xc920ac66, 0x7dce3ab4, 0x63df4a18, 0xe51a3182, 0x97513360, 0x62537f45, 0xb16477e0, 0xbb6bae84, 0xfe81a01c, 0xf9082b94, 0x70486858, 0x8f45fd19, 0x94de6c87, 0x527bf8b7, 0xab73d323, 0x724b02e2, 0xe31f8f57, 0x6655ab2a, 0xb2eb2807, 0x2fb5c203, 0x86c57b9a, 0xd33708a5, 0x302887f2, 0x23bfa5b2, 0x02036aba, 0xed16825c, 0x8acf1c2b, 0xa779b492, 0xf307f2f0, 0x4e69e2a1, 0x65daf4cd, 0x0605bed5, 0xd134621f, 0xc4a6fe8a, 0x342e539d, 0xa2f355a0, 0x058ae132, 0xa4f6eb75, 0x0b83ec39, 0x4060efaa, 0x5e719f06, 0xbd6e1051, 0x3e218af9, 0x96dd063d, 0xdd3e05ae, 0x4de6bd46, 0x91548db5, 0x71c45d05, 0x0406d46f, 0x605015ff, 0x1998fb24, 0xd6bde997, 0x894043cc, 0x67d99e77, 0xb0e842bd, 0x07898b88, 0xe7195b38, 0x79c8eedb, 0xa17c0a47, 0x7c420fe9, 0xf8841ec9, 0x00000000, 0x09808683, 0x322bed48, 0x1e1170ac, 0x6c5a724e, 0xfd0efffb, 0x0f853856, 0x3daed51e, 0x362d3927, 0x0a0fd964, 0x685ca621, 0x9b5b54d1, 0x24362e3a, 0x0c0a67b1, 0x9357e70f, 0xb4ee96d2, 0x1b9b919e, 0x80c0c54f, 0x61dc20a2, 0x5a774b69, 0x1c121a16, 0xe293ba0a, 0xc0a02ae5, 0x3c22e043, 0x121b171d, 0x0e090d0b, 0xf28bc7ad, 0x2db6a8b9, 0x141ea9c8, 0x57f11985, 0xaf75074c, 0xee99ddbb, 0xa37f60fd, 0xf701269f, 0x5c72f5bc, 0x44663bc5, 0x5bfb7e34, 0x8b432976, 0xcb23c6dc, 0xb6edfc68, 0xb8e4f163, 0xd731dcca, 0x42638510, 0x13972240, 0x84c61120, 0x854a247d, 0xd2bb3df8, 0xaef93211, 0xc729a16d, 0x1d9e2f4b, 0xdcb230f3, 0x0d8652ec, 0x77c1e3d0, 0x2bb3166c, 0xa970b999, 0x119448fa, 0x47e96422, 0xa8fc8cc4, 0xa0f03f1a, 0x567d2cd8, 0x223390ef, 0x87494ec7, 0xd938d1c1, 0x8ccaa2fe, 0x98d40b36, 0xa6f581cf, 0xa57ade28, 0xdab78e26, 0x3fadbfa4, 0x2c3a9de4, 0x5078920d, 0x6a5fcc9b, 0x547e4662, 0xf68d13c2, 0x90d8b8e8, 0x2e39f75e, 0x82c3aff5, 0x9f5d80be, 0x69d0937c, 0x6fd52da9, 0xcf2512b3, 0xc8ac993b, 0x10187da7, 0xe89c636e, 0xdb3bbb7b, 0xcd267809, 0x6e5918f4, 0xec9ab701, 0x834f9aa8, 0xe6956e65, 0xaaffe67e, 0x21bccf08, 0xef15e8e6, 0xbae79bd9, 0x4a6f36ce, 0xea9f09d4, 0x29b07cd6, 0x31a4b2af, 0x2a3f2331, 0xc6a59430, 0x35a266c0, 0x744ebc37, 0xfc82caa6, 0xe090d0b0, 0x33a7d815, 0xf104984a, 0x41ecdaf7, 0x7fcd500e, 0x1791f62f, 0x764dd68d, 0x43efb04d, 0xccaa4d54, 0xe49604df, 0x9ed1b5e3, 0x4c6a881b, 0xc12c1fb8, 0x4665517f, 0x9d5eea04, 0x018c355d, 0xfa877473, 0xfb0b412e, 0xb3671d5a, 0x92dbd252, 0xe9105633, 0x6dd64713, 0x9ad7618c, 0x37a10c7a, 0x59f8148e, 0xeb133c89, 0xcea927ee, 0xb761c935, 0xe11ce5ed, 0x7a47b13c, 0x9cd2df59, 0x55f2733f, 0x1814ce79, 0x73c737bf, 0x53f7cdea, 0x5ffdaa5b, 0xdf3d6f14, 0x7844db86, 0xcaaff381, 0xb968c43e, 0x3824342c, 0xc2a3405f, 0x161dc372, 0xbce2250c, 0x283c498b, 0xff0d9541, 0x39a80171, 0x080cb3de, 0xd8b4e49c, 0x6456c190, 0x7bcb8461, 0xd532b670, 0x486c5c74, 0xd0b85742];
    var T6 = [0x5051f4a7, 0x537e4165, 0xc31a17a4, 0x963a275e, 0xcb3bab6b, 0xf11f9d45, 0xabacfa58, 0x934be303, 0x552030fa, 0xf6ad766d, 0x9188cc76, 0x25f5024c, 0xfc4fe5d7, 0xd7c52acb, 0x80263544, 0x8fb562a3, 0x49deb15a, 0x6725ba1b, 0x9845ea0e, 0xe15dfec0, 0x02c32f75, 0x12814cf0, 0xa38d4697, 0xc66bd3f9, 0xe7038f5f, 0x9515929c, 0xebbf6d7a, 0xda955259, 0x2dd4be83, 0xd3587421, 0x2949e069, 0x448ec9c8, 0x6a75c289, 0x78f48e79, 0x6b99583e, 0xdd27b971, 0xb6bee14f, 0x17f088ad, 0x66c920ac, 0xb47dce3a, 0x1863df4a, 0x82e51a31, 0x60975133, 0x4562537f, 0xe0b16477, 0x84bb6bae, 0x1cfe81a0, 0x94f9082b, 0x58704868, 0x198f45fd, 0x8794de6c, 0xb7527bf8, 0x23ab73d3, 0xe2724b02, 0x57e31f8f, 0x2a6655ab, 0x07b2eb28, 0x032fb5c2, 0x9a86c57b, 0xa5d33708, 0xf2302887, 0xb223bfa5, 0xba02036a, 0x5ced1682, 0x2b8acf1c, 0x92a779b4, 0xf0f307f2, 0xa14e69e2, 0xcd65daf4, 0xd50605be, 0x1fd13462, 0x8ac4a6fe, 0x9d342e53, 0xa0a2f355, 0x32058ae1, 0x75a4f6eb, 0x390b83ec, 0xaa4060ef, 0x065e719f, 0x51bd6e10, 0xf93e218a, 0x3d96dd06, 0xaedd3e05, 0x464de6bd, 0xb591548d, 0x0571c45d, 0x6f0406d4, 0xff605015, 0x241998fb, 0x97d6bde9, 0xcc894043, 0x7767d99e, 0xbdb0e842, 0x8807898b, 0x38e7195b, 0xdb79c8ee, 0x47a17c0a, 0xe97c420f, 0xc9f8841e, 0x00000000, 0x83098086, 0x48322bed, 0xac1e1170, 0x4e6c5a72, 0xfbfd0eff, 0x560f8538, 0x1e3daed5, 0x27362d39, 0x640a0fd9, 0x21685ca6, 0xd19b5b54, 0x3a24362e, 0xb10c0a67, 0x0f9357e7, 0xd2b4ee96, 0x9e1b9b91, 0x4f80c0c5, 0xa261dc20, 0x695a774b, 0x161c121a, 0x0ae293ba, 0xe5c0a02a, 0x433c22e0, 0x1d121b17, 0x0b0e090d, 0xadf28bc7, 0xb92db6a8, 0xc8141ea9, 0x8557f119, 0x4caf7507, 0xbbee99dd, 0xfda37f60, 0x9ff70126, 0xbc5c72f5, 0xc544663b, 0x345bfb7e, 0x768b4329, 0xdccb23c6, 0x68b6edfc, 0x63b8e4f1, 0xcad731dc, 0x10426385, 0x40139722, 0x2084c611, 0x7d854a24, 0xf8d2bb3d, 0x11aef932, 0x6dc729a1, 0x4b1d9e2f, 0xf3dcb230, 0xec0d8652, 0xd077c1e3, 0x6c2bb316, 0x99a970b9, 0xfa119448, 0x2247e964, 0xc4a8fc8c, 0x1aa0f03f, 0xd8567d2c, 0xef223390, 0xc787494e, 0xc1d938d1, 0xfe8ccaa2, 0x3698d40b, 0xcfa6f581, 0x28a57ade, 0x26dab78e, 0xa43fadbf, 0xe42c3a9d, 0x0d507892, 0x9b6a5fcc, 0x62547e46, 0xc2f68d13, 0xe890d8b8, 0x5e2e39f7, 0xf582c3af, 0xbe9f5d80, 0x7c69d093, 0xa96fd52d, 0xb3cf2512, 0x3bc8ac99, 0xa710187d, 0x6ee89c63, 0x7bdb3bbb, 0x09cd2678, 0xf46e5918, 0x01ec9ab7, 0xa8834f9a, 0x65e6956e, 0x7eaaffe6, 0x0821bccf, 0xe6ef15e8, 0xd9bae79b, 0xce4a6f36, 0xd4ea9f09, 0xd629b07c, 0xaf31a4b2, 0x312a3f23, 0x30c6a594, 0xc035a266, 0x37744ebc, 0xa6fc82ca, 0xb0e090d0, 0x1533a7d8, 0x4af10498, 0xf741ecda, 0x0e7fcd50, 0x2f1791f6, 0x8d764dd6, 0x4d43efb0, 0x54ccaa4d, 0xdfe49604, 0xe39ed1b5, 0x1b4c6a88, 0xb8c12c1f, 0x7f466551, 0x049d5eea, 0x5d018c35, 0x73fa8774, 0x2efb0b41, 0x5ab3671d, 0x5292dbd2, 0x33e91056, 0x136dd647, 0x8c9ad761, 0x7a37a10c, 0x8e59f814, 0x89eb133c, 0xeecea927, 0x35b761c9, 0xede11ce5, 0x3c7a47b1, 0x599cd2df, 0x3f55f273, 0x791814ce, 0xbf73c737, 0xea53f7cd, 0x5b5ffdaa, 0x14df3d6f, 0x867844db, 0x81caaff3, 0x3eb968c4, 0x2c382434, 0x5fc2a340, 0x72161dc3, 0x0cbce225, 0x8b283c49, 0x41ff0d95, 0x7139a801, 0xde080cb3, 0x9cd8b4e4, 0x906456c1, 0x617bcb84, 0x70d532b6, 0x74486c5c, 0x42d0b857];
    var T7 = [0xa75051f4, 0x65537e41, 0xa4c31a17, 0x5e963a27, 0x6bcb3bab, 0x45f11f9d, 0x58abacfa, 0x03934be3, 0xfa552030, 0x6df6ad76, 0x769188cc, 0x4c25f502, 0xd7fc4fe5, 0xcbd7c52a, 0x44802635, 0xa38fb562, 0x5a49deb1, 0x1b6725ba, 0x0e9845ea, 0xc0e15dfe, 0x7502c32f, 0xf012814c, 0x97a38d46, 0xf9c66bd3, 0x5fe7038f, 0x9c951592, 0x7aebbf6d, 0x59da9552, 0x832dd4be, 0x21d35874, 0x692949e0, 0xc8448ec9, 0x896a75c2, 0x7978f48e, 0x3e6b9958, 0x71dd27b9, 0x4fb6bee1, 0xad17f088, 0xac66c920, 0x3ab47dce, 0x4a1863df, 0x3182e51a, 0x33609751, 0x7f456253, 0x77e0b164, 0xae84bb6b, 0xa01cfe81, 0x2b94f908, 0x68587048, 0xfd198f45, 0x6c8794de, 0xf8b7527b, 0xd323ab73, 0x02e2724b, 0x8f57e31f, 0xab2a6655, 0x2807b2eb, 0xc2032fb5, 0x7b9a86c5, 0x08a5d337, 0x87f23028, 0xa5b223bf, 0x6aba0203, 0x825ced16, 0x1c2b8acf, 0xb492a779, 0xf2f0f307, 0xe2a14e69, 0xf4cd65da, 0xbed50605, 0x621fd134, 0xfe8ac4a6, 0x539d342e, 0x55a0a2f3, 0xe132058a, 0xeb75a4f6, 0xec390b83, 0xefaa4060, 0x9f065e71, 0x1051bd6e, 0x8af93e21, 0x063d96dd, 0x05aedd3e, 0xbd464de6, 0x8db59154, 0x5d0571c4, 0xd46f0406, 0x15ff6050, 0xfb241998, 0xe997d6bd, 0x43cc8940, 0x9e7767d9, 0x42bdb0e8, 0x8b880789, 0x5b38e719, 0xeedb79c8, 0x0a47a17c, 0x0fe97c42, 0x1ec9f884, 0x00000000, 0x86830980, 0xed48322b, 0x70ac1e11, 0x724e6c5a, 0xfffbfd0e, 0x38560f85, 0xd51e3dae, 0x3927362d, 0xd9640a0f, 0xa621685c, 0x54d19b5b, 0x2e3a2436, 0x67b10c0a, 0xe70f9357, 0x96d2b4ee, 0x919e1b9b, 0xc54f80c0, 0x20a261dc, 0x4b695a77, 0x1a161c12, 0xba0ae293, 0x2ae5c0a0, 0xe0433c22, 0x171d121b, 0x0d0b0e09, 0xc7adf28b, 0xa8b92db6, 0xa9c8141e, 0x198557f1, 0x074caf75, 0xddbbee99, 0x60fda37f, 0x269ff701, 0xf5bc5c72, 0x3bc54466, 0x7e345bfb, 0x29768b43, 0xc6dccb23, 0xfc68b6ed, 0xf163b8e4, 0xdccad731, 0x85104263, 0x22401397, 0x112084c6, 0x247d854a, 0x3df8d2bb, 0x3211aef9, 0xa16dc729, 0x2f4b1d9e, 0x30f3dcb2, 0x52ec0d86, 0xe3d077c1, 0x166c2bb3, 0xb999a970, 0x48fa1194, 0x642247e9, 0x8cc4a8fc, 0x3f1aa0f0, 0x2cd8567d, 0x90ef2233, 0x4ec78749, 0xd1c1d938, 0xa2fe8cca, 0x0b3698d4, 0x81cfa6f5, 0xde28a57a, 0x8e26dab7, 0xbfa43fad, 0x9de42c3a, 0x920d5078, 0xcc9b6a5f, 0x4662547e, 0x13c2f68d, 0xb8e890d8, 0xf75e2e39, 0xaff582c3, 0x80be9f5d, 0x937c69d0, 0x2da96fd5, 0x12b3cf25, 0x993bc8ac, 0x7da71018, 0x636ee89c, 0xbb7bdb3b, 0x7809cd26, 0x18f46e59, 0xb701ec9a, 0x9aa8834f, 0x6e65e695, 0xe67eaaff, 0xcf0821bc, 0xe8e6ef15, 0x9bd9bae7, 0x36ce4a6f, 0x09d4ea9f, 0x7cd629b0, 0xb2af31a4, 0x23312a3f, 0x9430c6a5, 0x66c035a2, 0xbc37744e, 0xcaa6fc82, 0xd0b0e090, 0xd81533a7, 0x984af104, 0xdaf741ec, 0x500e7fcd, 0xf62f1791, 0xd68d764d, 0xb04d43ef, 0x4d54ccaa, 0x04dfe496, 0xb5e39ed1, 0x881b4c6a, 0x1fb8c12c, 0x517f4665, 0xea049d5e, 0x355d018c, 0x7473fa87, 0x412efb0b, 0x1d5ab367, 0xd25292db, 0x5633e910, 0x47136dd6, 0x618c9ad7, 0x0c7a37a1, 0x148e59f8, 0x3c89eb13, 0x27eecea9, 0xc935b761, 0xe5ede11c, 0xb13c7a47, 0xdf599cd2, 0x733f55f2, 0xce791814, 0x37bf73c7, 0xcdea53f7, 0xaa5b5ffd, 0x6f14df3d, 0xdb867844, 0xf381caaf, 0xc43eb968, 0x342c3824, 0x405fc2a3, 0xc372161d, 0x250cbce2, 0x498b283c, 0x9541ff0d, 0x017139a8, 0xb3de080c, 0xe49cd8b4, 0xc1906456, 0x84617bcb, 0xb670d532, 0x5c74486c, 0x5742d0b8];
    var T8 = [0xf4a75051, 0x4165537e, 0x17a4c31a, 0x275e963a, 0xab6bcb3b, 0x9d45f11f, 0xfa58abac, 0xe303934b, 0x30fa5520, 0x766df6ad, 0xcc769188, 0x024c25f5, 0xe5d7fc4f, 0x2acbd7c5, 0x35448026, 0x62a38fb5, 0xb15a49de, 0xba1b6725, 0xea0e9845, 0xfec0e15d, 0x2f7502c3, 0x4cf01281, 0x4697a38d, 0xd3f9c66b, 0x8f5fe703, 0x929c9515, 0x6d7aebbf, 0x5259da95, 0xbe832dd4, 0x7421d358, 0xe0692949, 0xc9c8448e, 0xc2896a75, 0x8e7978f4, 0x583e6b99, 0xb971dd27, 0xe14fb6be, 0x88ad17f0, 0x20ac66c9, 0xce3ab47d, 0xdf4a1863, 0x1a3182e5, 0x51336097, 0x537f4562, 0x6477e0b1, 0x6bae84bb, 0x81a01cfe, 0x082b94f9, 0x48685870, 0x45fd198f, 0xde6c8794, 0x7bf8b752, 0x73d323ab, 0x4b02e272, 0x1f8f57e3, 0x55ab2a66, 0xeb2807b2, 0xb5c2032f, 0xc57b9a86, 0x3708a5d3, 0x2887f230, 0xbfa5b223, 0x036aba02, 0x16825ced, 0xcf1c2b8a, 0x79b492a7, 0x07f2f0f3, 0x69e2a14e, 0xdaf4cd65, 0x05bed506, 0x34621fd1, 0xa6fe8ac4, 0x2e539d34, 0xf355a0a2, 0x8ae13205, 0xf6eb75a4, 0x83ec390b, 0x60efaa40, 0x719f065e, 0x6e1051bd, 0x218af93e, 0xdd063d96, 0x3e05aedd, 0xe6bd464d, 0x548db591, 0xc45d0571, 0x06d46f04, 0x5015ff60, 0x98fb2419, 0xbde997d6, 0x4043cc89, 0xd99e7767, 0xe842bdb0, 0x898b8807, 0x195b38e7, 0xc8eedb79, 0x7c0a47a1, 0x420fe97c, 0x841ec9f8, 0x00000000, 0x80868309, 0x2bed4832, 0x1170ac1e, 0x5a724e6c, 0x0efffbfd, 0x8538560f, 0xaed51e3d, 0x2d392736, 0x0fd9640a, 0x5ca62168, 0x5b54d19b, 0x362e3a24, 0x0a67b10c, 0x57e70f93, 0xee96d2b4, 0x9b919e1b, 0xc0c54f80, 0xdc20a261, 0x774b695a, 0x121a161c, 0x93ba0ae2, 0xa02ae5c0, 0x22e0433c, 0x1b171d12, 0x090d0b0e, 0x8bc7adf2, 0xb6a8b92d, 0x1ea9c814, 0xf1198557, 0x75074caf, 0x99ddbbee, 0x7f60fda3, 0x01269ff7, 0x72f5bc5c, 0x663bc544, 0xfb7e345b, 0x4329768b, 0x23c6dccb, 0xedfc68b6, 0xe4f163b8, 0x31dccad7, 0x63851042, 0x97224013, 0xc6112084, 0x4a247d85, 0xbb3df8d2, 0xf93211ae, 0x29a16dc7, 0x9e2f4b1d, 0xb230f3dc, 0x8652ec0d, 0xc1e3d077, 0xb3166c2b, 0x70b999a9, 0x9448fa11, 0xe9642247, 0xfc8cc4a8, 0xf03f1aa0, 0x7d2cd856, 0x3390ef22, 0x494ec787, 0x38d1c1d9, 0xcaa2fe8c, 0xd40b3698, 0xf581cfa6, 0x7ade28a5, 0xb78e26da, 0xadbfa43f, 0x3a9de42c, 0x78920d50, 0x5fcc9b6a, 0x7e466254, 0x8d13c2f6, 0xd8b8e890, 0x39f75e2e, 0xc3aff582, 0x5d80be9f, 0xd0937c69, 0xd52da96f, 0x2512b3cf, 0xac993bc8, 0x187da710, 0x9c636ee8, 0x3bbb7bdb, 0x267809cd, 0x5918f46e, 0x9ab701ec, 0x4f9aa883, 0x956e65e6, 0xffe67eaa, 0xbccf0821, 0x15e8e6ef, 0xe79bd9ba, 0x6f36ce4a, 0x9f09d4ea, 0xb07cd629, 0xa4b2af31, 0x3f23312a, 0xa59430c6, 0xa266c035, 0x4ebc3774, 0x82caa6fc, 0x90d0b0e0, 0xa7d81533, 0x04984af1, 0xecdaf741, 0xcd500e7f, 0x91f62f17, 0x4dd68d76, 0xefb04d43, 0xaa4d54cc, 0x9604dfe4, 0xd1b5e39e, 0x6a881b4c, 0x2c1fb8c1, 0x65517f46, 0x5eea049d, 0x8c355d01, 0x877473fa, 0x0b412efb, 0x671d5ab3, 0xdbd25292, 0x105633e9, 0xd647136d, 0xd7618c9a, 0xa10c7a37, 0xf8148e59, 0x133c89eb, 0xa927eece, 0x61c935b7, 0x1ce5ede1, 0x47b13c7a, 0xd2df599c, 0xf2733f55, 0x14ce7918, 0xc737bf73, 0xf7cdea53, 0xfdaa5b5f, 0x3d6f14df, 0x44db8678, 0xaff381ca, 0x68c43eb9, 0x24342c38, 0xa3405fc2, 0x1dc37216, 0xe2250cbc, 0x3c498b28, 0x0d9541ff, 0xa8017139, 0x0cb3de08, 0xb4e49cd8, 0x56c19064, 0xcb84617b, 0x32b670d5, 0x6c5c7448, 0xb85742d0];

    // Transformations for decryption key expansion
    var U1 = [0x00000000, 0x0e090d0b, 0x1c121a16, 0x121b171d, 0x3824342c, 0x362d3927, 0x24362e3a, 0x2a3f2331, 0x70486858, 0x7e416553, 0x6c5a724e, 0x62537f45, 0x486c5c74, 0x4665517f, 0x547e4662, 0x5a774b69, 0xe090d0b0, 0xee99ddbb, 0xfc82caa6, 0xf28bc7ad, 0xd8b4e49c, 0xd6bde997, 0xc4a6fe8a, 0xcaaff381, 0x90d8b8e8, 0x9ed1b5e3, 0x8ccaa2fe, 0x82c3aff5, 0xa8fc8cc4, 0xa6f581cf, 0xb4ee96d2, 0xbae79bd9, 0xdb3bbb7b, 0xd532b670, 0xc729a16d, 0xc920ac66, 0xe31f8f57, 0xed16825c, 0xff0d9541, 0xf104984a, 0xab73d323, 0xa57ade28, 0xb761c935, 0xb968c43e, 0x9357e70f, 0x9d5eea04, 0x8f45fd19, 0x814cf012, 0x3bab6bcb, 0x35a266c0, 0x27b971dd, 0x29b07cd6, 0x038f5fe7, 0x0d8652ec, 0x1f9d45f1, 0x119448fa, 0x4be30393, 0x45ea0e98, 0x57f11985, 0x59f8148e, 0x73c737bf, 0x7dce3ab4, 0x6fd52da9, 0x61dc20a2, 0xad766df6, 0xa37f60fd, 0xb16477e0, 0xbf6d7aeb, 0x955259da, 0x9b5b54d1, 0x894043cc, 0x87494ec7, 0xdd3e05ae, 0xd33708a5, 0xc12c1fb8, 0xcf2512b3, 0xe51a3182, 0xeb133c89, 0xf9082b94, 0xf701269f, 0x4de6bd46, 0x43efb04d, 0x51f4a750, 0x5ffdaa5b, 0x75c2896a, 0x7bcb8461, 0x69d0937c, 0x67d99e77, 0x3daed51e, 0x33a7d815, 0x21bccf08, 0x2fb5c203, 0x058ae132, 0x0b83ec39, 0x1998fb24, 0x1791f62f, 0x764dd68d, 0x7844db86, 0x6a5fcc9b, 0x6456c190, 0x4e69e2a1, 0x4060efaa, 0x527bf8b7, 0x5c72f5bc, 0x0605bed5, 0x080cb3de, 0x1a17a4c3, 0x141ea9c8, 0x3e218af9, 0x302887f2, 0x223390ef, 0x2c3a9de4, 0x96dd063d, 0x98d40b36, 0x8acf1c2b, 0x84c61120, 0xaef93211, 0xa0f03f1a, 0xb2eb2807, 0xbce2250c, 0xe6956e65, 0xe89c636e, 0xfa877473, 0xf48e7978, 0xdeb15a49, 0xd0b85742, 0xc2a3405f, 0xccaa4d54, 0x41ecdaf7, 0x4fe5d7fc, 0x5dfec0e1, 0x53f7cdea, 0x79c8eedb, 0x77c1e3d0, 0x65daf4cd, 0x6bd3f9c6, 0x31a4b2af, 0x3fadbfa4, 0x2db6a8b9, 0x23bfa5b2, 0x09808683, 0x07898b88, 0x15929c95, 0x1b9b919e, 0xa17c0a47, 0xaf75074c, 0xbd6e1051, 0xb3671d5a, 0x99583e6b, 0x97513360, 0x854a247d, 0x8b432976, 0xd134621f, 0xdf3d6f14, 0xcd267809, 0xc32f7502, 0xe9105633, 0xe7195b38, 0xf5024c25, 0xfb0b412e, 0x9ad7618c, 0x94de6c87, 0x86c57b9a, 0x88cc7691, 0xa2f355a0, 0xacfa58ab, 0xbee14fb6, 0xb0e842bd, 0xea9f09d4, 0xe49604df, 0xf68d13c2, 0xf8841ec9, 0xd2bb3df8, 0xdcb230f3, 0xcea927ee, 0xc0a02ae5, 0x7a47b13c, 0x744ebc37, 0x6655ab2a, 0x685ca621, 0x42638510, 0x4c6a881b, 0x5e719f06, 0x5078920d, 0x0a0fd964, 0x0406d46f, 0x161dc372, 0x1814ce79, 0x322bed48, 0x3c22e043, 0x2e39f75e, 0x2030fa55, 0xec9ab701, 0xe293ba0a, 0xf088ad17, 0xfe81a01c, 0xd4be832d, 0xdab78e26, 0xc8ac993b, 0xc6a59430, 0x9cd2df59, 0x92dbd252, 0x80c0c54f, 0x8ec9c844, 0xa4f6eb75, 0xaaffe67e, 0xb8e4f163, 0xb6edfc68, 0x0c0a67b1, 0x02036aba, 0x10187da7, 0x1e1170ac, 0x342e539d, 0x3a275e96, 0x283c498b, 0x26354480, 0x7c420fe9, 0x724b02e2, 0x605015ff, 0x6e5918f4, 0x44663bc5, 0x4a6f36ce, 0x587421d3, 0x567d2cd8, 0x37a10c7a, 0x39a80171, 0x2bb3166c, 0x25ba1b67, 0x0f853856, 0x018c355d, 0x13972240, 0x1d9e2f4b, 0x47e96422, 0x49e06929, 0x5bfb7e34, 0x55f2733f, 0x7fcd500e, 0x71c45d05, 0x63df4a18, 0x6dd64713, 0xd731dcca, 0xd938d1c1, 0xcb23c6dc, 0xc52acbd7, 0xef15e8e6, 0xe11ce5ed, 0xf307f2f0, 0xfd0efffb, 0xa779b492, 0xa970b999, 0xbb6bae84, 0xb562a38f, 0x9f5d80be, 0x91548db5, 0x834f9aa8, 0x8d4697a3];
    var U2 = [0x00000000, 0x0b0e090d, 0x161c121a, 0x1d121b17, 0x2c382434, 0x27362d39, 0x3a24362e, 0x312a3f23, 0x58704868, 0x537e4165, 0x4e6c5a72, 0x4562537f, 0x74486c5c, 0x7f466551, 0x62547e46, 0x695a774b, 0xb0e090d0, 0xbbee99dd, 0xa6fc82ca, 0xadf28bc7, 0x9cd8b4e4, 0x97d6bde9, 0x8ac4a6fe, 0x81caaff3, 0xe890d8b8, 0xe39ed1b5, 0xfe8ccaa2, 0xf582c3af, 0xc4a8fc8c, 0xcfa6f581, 0xd2b4ee96, 0xd9bae79b, 0x7bdb3bbb, 0x70d532b6, 0x6dc729a1, 0x66c920ac, 0x57e31f8f, 0x5ced1682, 0x41ff0d95, 0x4af10498, 0x23ab73d3, 0x28a57ade, 0x35b761c9, 0x3eb968c4, 0x0f9357e7, 0x049d5eea, 0x198f45fd, 0x12814cf0, 0xcb3bab6b, 0xc035a266, 0xdd27b971, 0xd629b07c, 0xe7038f5f, 0xec0d8652, 0xf11f9d45, 0xfa119448, 0x934be303, 0x9845ea0e, 0x8557f119, 0x8e59f814, 0xbf73c737, 0xb47dce3a, 0xa96fd52d, 0xa261dc20, 0xf6ad766d, 0xfda37f60, 0xe0b16477, 0xebbf6d7a, 0xda955259, 0xd19b5b54, 0xcc894043, 0xc787494e, 0xaedd3e05, 0xa5d33708, 0xb8c12c1f, 0xb3cf2512, 0x82e51a31, 0x89eb133c, 0x94f9082b, 0x9ff70126, 0x464de6bd, 0x4d43efb0, 0x5051f4a7, 0x5b5ffdaa, 0x6a75c289, 0x617bcb84, 0x7c69d093, 0x7767d99e, 0x1e3daed5, 0x1533a7d8, 0x0821bccf, 0x032fb5c2, 0x32058ae1, 0x390b83ec, 0x241998fb, 0x2f1791f6, 0x8d764dd6, 0x867844db, 0x9b6a5fcc, 0x906456c1, 0xa14e69e2, 0xaa4060ef, 0xb7527bf8, 0xbc5c72f5, 0xd50605be, 0xde080cb3, 0xc31a17a4, 0xc8141ea9, 0xf93e218a, 0xf2302887, 0xef223390, 0xe42c3a9d, 0x3d96dd06, 0x3698d40b, 0x2b8acf1c, 0x2084c611, 0x11aef932, 0x1aa0f03f, 0x07b2eb28, 0x0cbce225, 0x65e6956e, 0x6ee89c63, 0x73fa8774, 0x78f48e79, 0x49deb15a, 0x42d0b857, 0x5fc2a340, 0x54ccaa4d, 0xf741ecda, 0xfc4fe5d7, 0xe15dfec0, 0xea53f7cd, 0xdb79c8ee, 0xd077c1e3, 0xcd65daf4, 0xc66bd3f9, 0xaf31a4b2, 0xa43fadbf, 0xb92db6a8, 0xb223bfa5, 0x83098086, 0x8807898b, 0x9515929c, 0x9e1b9b91, 0x47a17c0a, 0x4caf7507, 0x51bd6e10, 0x5ab3671d, 0x6b99583e, 0x60975133, 0x7d854a24, 0x768b4329, 0x1fd13462, 0x14df3d6f, 0x09cd2678, 0x02c32f75, 0x33e91056, 0x38e7195b, 0x25f5024c, 0x2efb0b41, 0x8c9ad761, 0x8794de6c, 0x9a86c57b, 0x9188cc76, 0xa0a2f355, 0xabacfa58, 0xb6bee14f, 0xbdb0e842, 0xd4ea9f09, 0xdfe49604, 0xc2f68d13, 0xc9f8841e, 0xf8d2bb3d, 0xf3dcb230, 0xeecea927, 0xe5c0a02a, 0x3c7a47b1, 0x37744ebc, 0x2a6655ab, 0x21685ca6, 0x10426385, 0x1b4c6a88, 0x065e719f, 0x0d507892, 0x640a0fd9, 0x6f0406d4, 0x72161dc3, 0x791814ce, 0x48322bed, 0x433c22e0, 0x5e2e39f7, 0x552030fa, 0x01ec9ab7, 0x0ae293ba, 0x17f088ad, 0x1cfe81a0, 0x2dd4be83, 0x26dab78e, 0x3bc8ac99, 0x30c6a594, 0x599cd2df, 0x5292dbd2, 0x4f80c0c5, 0x448ec9c8, 0x75a4f6eb, 0x7eaaffe6, 0x63b8e4f1, 0x68b6edfc, 0xb10c0a67, 0xba02036a, 0xa710187d, 0xac1e1170, 0x9d342e53, 0x963a275e, 0x8b283c49, 0x80263544, 0xe97c420f, 0xe2724b02, 0xff605015, 0xf46e5918, 0xc544663b, 0xce4a6f36, 0xd3587421, 0xd8567d2c, 0x7a37a10c, 0x7139a801, 0x6c2bb316, 0x6725ba1b, 0x560f8538, 0x5d018c35, 0x40139722, 0x4b1d9e2f, 0x2247e964, 0x2949e069, 0x345bfb7e, 0x3f55f273, 0x0e7fcd50, 0x0571c45d, 0x1863df4a, 0x136dd647, 0xcad731dc, 0xc1d938d1, 0xdccb23c6, 0xd7c52acb, 0xe6ef15e8, 0xede11ce5, 0xf0f307f2, 0xfbfd0eff, 0x92a779b4, 0x99a970b9, 0x84bb6bae, 0x8fb562a3, 0xbe9f5d80, 0xb591548d, 0xa8834f9a, 0xa38d4697];
    var U3 = [0x00000000, 0x0d0b0e09, 0x1a161c12, 0x171d121b, 0x342c3824, 0x3927362d, 0x2e3a2436, 0x23312a3f, 0x68587048, 0x65537e41, 0x724e6c5a, 0x7f456253, 0x5c74486c, 0x517f4665, 0x4662547e, 0x4b695a77, 0xd0b0e090, 0xddbbee99, 0xcaa6fc82, 0xc7adf28b, 0xe49cd8b4, 0xe997d6bd, 0xfe8ac4a6, 0xf381caaf, 0xb8e890d8, 0xb5e39ed1, 0xa2fe8cca, 0xaff582c3, 0x8cc4a8fc, 0x81cfa6f5, 0x96d2b4ee, 0x9bd9bae7, 0xbb7bdb3b, 0xb670d532, 0xa16dc729, 0xac66c920, 0x8f57e31f, 0x825ced16, 0x9541ff0d, 0x984af104, 0xd323ab73, 0xde28a57a, 0xc935b761, 0xc43eb968, 0xe70f9357, 0xea049d5e, 0xfd198f45, 0xf012814c, 0x6bcb3bab, 0x66c035a2, 0x71dd27b9, 0x7cd629b0, 0x5fe7038f, 0x52ec0d86, 0x45f11f9d, 0x48fa1194, 0x03934be3, 0x0e9845ea, 0x198557f1, 0x148e59f8, 0x37bf73c7, 0x3ab47dce, 0x2da96fd5, 0x20a261dc, 0x6df6ad76, 0x60fda37f, 0x77e0b164, 0x7aebbf6d, 0x59da9552, 0x54d19b5b, 0x43cc8940, 0x4ec78749, 0x05aedd3e, 0x08a5d337, 0x1fb8c12c, 0x12b3cf25, 0x3182e51a, 0x3c89eb13, 0x2b94f908, 0x269ff701, 0xbd464de6, 0xb04d43ef, 0xa75051f4, 0xaa5b5ffd, 0x896a75c2, 0x84617bcb, 0x937c69d0, 0x9e7767d9, 0xd51e3dae, 0xd81533a7, 0xcf0821bc, 0xc2032fb5, 0xe132058a, 0xec390b83, 0xfb241998, 0xf62f1791, 0xd68d764d, 0xdb867844, 0xcc9b6a5f, 0xc1906456, 0xe2a14e69, 0xefaa4060, 0xf8b7527b, 0xf5bc5c72, 0xbed50605, 0xb3de080c, 0xa4c31a17, 0xa9c8141e, 0x8af93e21, 0x87f23028, 0x90ef2233, 0x9de42c3a, 0x063d96dd, 0x0b3698d4, 0x1c2b8acf, 0x112084c6, 0x3211aef9, 0x3f1aa0f0, 0x2807b2eb, 0x250cbce2, 0x6e65e695, 0x636ee89c, 0x7473fa87, 0x7978f48e, 0x5a49deb1, 0x5742d0b8, 0x405fc2a3, 0x4d54ccaa, 0xdaf741ec, 0xd7fc4fe5, 0xc0e15dfe, 0xcdea53f7, 0xeedb79c8, 0xe3d077c1, 0xf4cd65da, 0xf9c66bd3, 0xb2af31a4, 0xbfa43fad, 0xa8b92db6, 0xa5b223bf, 0x86830980, 0x8b880789, 0x9c951592, 0x919e1b9b, 0x0a47a17c, 0x074caf75, 0x1051bd6e, 0x1d5ab367, 0x3e6b9958, 0x33609751, 0x247d854a, 0x29768b43, 0x621fd134, 0x6f14df3d, 0x7809cd26, 0x7502c32f, 0x5633e910, 0x5b38e719, 0x4c25f502, 0x412efb0b, 0x618c9ad7, 0x6c8794de, 0x7b9a86c5, 0x769188cc, 0x55a0a2f3, 0x58abacfa, 0x4fb6bee1, 0x42bdb0e8, 0x09d4ea9f, 0x04dfe496, 0x13c2f68d, 0x1ec9f884, 0x3df8d2bb, 0x30f3dcb2, 0x27eecea9, 0x2ae5c0a0, 0xb13c7a47, 0xbc37744e, 0xab2a6655, 0xa621685c, 0x85104263, 0x881b4c6a, 0x9f065e71, 0x920d5078, 0xd9640a0f, 0xd46f0406, 0xc372161d, 0xce791814, 0xed48322b, 0xe0433c22, 0xf75e2e39, 0xfa552030, 0xb701ec9a, 0xba0ae293, 0xad17f088, 0xa01cfe81, 0x832dd4be, 0x8e26dab7, 0x993bc8ac, 0x9430c6a5, 0xdf599cd2, 0xd25292db, 0xc54f80c0, 0xc8448ec9, 0xeb75a4f6, 0xe67eaaff, 0xf163b8e4, 0xfc68b6ed, 0x67b10c0a, 0x6aba0203, 0x7da71018, 0x70ac1e11, 0x539d342e, 0x5e963a27, 0x498b283c, 0x44802635, 0x0fe97c42, 0x02e2724b, 0x15ff6050, 0x18f46e59, 0x3bc54466, 0x36ce4a6f, 0x21d35874, 0x2cd8567d, 0x0c7a37a1, 0x017139a8, 0x166c2bb3, 0x1b6725ba, 0x38560f85, 0x355d018c, 0x22401397, 0x2f4b1d9e, 0x642247e9, 0x692949e0, 0x7e345bfb, 0x733f55f2, 0x500e7fcd, 0x5d0571c4, 0x4a1863df, 0x47136dd6, 0xdccad731, 0xd1c1d938, 0xc6dccb23, 0xcbd7c52a, 0xe8e6ef15, 0xe5ede11c, 0xf2f0f307, 0xfffbfd0e, 0xb492a779, 0xb999a970, 0xae84bb6b, 0xa38fb562, 0x80be9f5d, 0x8db59154, 0x9aa8834f, 0x97a38d46];
    var U4 = [0x00000000, 0x090d0b0e, 0x121a161c, 0x1b171d12, 0x24342c38, 0x2d392736, 0x362e3a24, 0x3f23312a, 0x48685870, 0x4165537e, 0x5a724e6c, 0x537f4562, 0x6c5c7448, 0x65517f46, 0x7e466254, 0x774b695a, 0x90d0b0e0, 0x99ddbbee, 0x82caa6fc, 0x8bc7adf2, 0xb4e49cd8, 0xbde997d6, 0xa6fe8ac4, 0xaff381ca, 0xd8b8e890, 0xd1b5e39e, 0xcaa2fe8c, 0xc3aff582, 0xfc8cc4a8, 0xf581cfa6, 0xee96d2b4, 0xe79bd9ba, 0x3bbb7bdb, 0x32b670d5, 0x29a16dc7, 0x20ac66c9, 0x1f8f57e3, 0x16825ced, 0x0d9541ff, 0x04984af1, 0x73d323ab, 0x7ade28a5, 0x61c935b7, 0x68c43eb9, 0x57e70f93, 0x5eea049d, 0x45fd198f, 0x4cf01281, 0xab6bcb3b, 0xa266c035, 0xb971dd27, 0xb07cd629, 0x8f5fe703, 0x8652ec0d, 0x9d45f11f, 0x9448fa11, 0xe303934b, 0xea0e9845, 0xf1198557, 0xf8148e59, 0xc737bf73, 0xce3ab47d, 0xd52da96f, 0xdc20a261, 0x766df6ad, 0x7f60fda3, 0x6477e0b1, 0x6d7aebbf, 0x5259da95, 0x5b54d19b, 0x4043cc89, 0x494ec787, 0x3e05aedd, 0x3708a5d3, 0x2c1fb8c1, 0x2512b3cf, 0x1a3182e5, 0x133c89eb, 0x082b94f9, 0x01269ff7, 0xe6bd464d, 0xefb04d43, 0xf4a75051, 0xfdaa5b5f, 0xc2896a75, 0xcb84617b, 0xd0937c69, 0xd99e7767, 0xaed51e3d, 0xa7d81533, 0xbccf0821, 0xb5c2032f, 0x8ae13205, 0x83ec390b, 0x98fb2419, 0x91f62f17, 0x4dd68d76, 0x44db8678, 0x5fcc9b6a, 0x56c19064, 0x69e2a14e, 0x60efaa40, 0x7bf8b752, 0x72f5bc5c, 0x05bed506, 0x0cb3de08, 0x17a4c31a, 0x1ea9c814, 0x218af93e, 0x2887f230, 0x3390ef22, 0x3a9de42c, 0xdd063d96, 0xd40b3698, 0xcf1c2b8a, 0xc6112084, 0xf93211ae, 0xf03f1aa0, 0xeb2807b2, 0xe2250cbc, 0x956e65e6, 0x9c636ee8, 0x877473fa, 0x8e7978f4, 0xb15a49de, 0xb85742d0, 0xa3405fc2, 0xaa4d54cc, 0xecdaf741, 0xe5d7fc4f, 0xfec0e15d, 0xf7cdea53, 0xc8eedb79, 0xc1e3d077, 0xdaf4cd65, 0xd3f9c66b, 0xa4b2af31, 0xadbfa43f, 0xb6a8b92d, 0xbfa5b223, 0x80868309, 0x898b8807, 0x929c9515, 0x9b919e1b, 0x7c0a47a1, 0x75074caf, 0x6e1051bd, 0x671d5ab3, 0x583e6b99, 0x51336097, 0x4a247d85, 0x4329768b, 0x34621fd1, 0x3d6f14df, 0x267809cd, 0x2f7502c3, 0x105633e9, 0x195b38e7, 0x024c25f5, 0x0b412efb, 0xd7618c9a, 0xde6c8794, 0xc57b9a86, 0xcc769188, 0xf355a0a2, 0xfa58abac, 0xe14fb6be, 0xe842bdb0, 0x9f09d4ea, 0x9604dfe4, 0x8d13c2f6, 0x841ec9f8, 0xbb3df8d2, 0xb230f3dc, 0xa927eece, 0xa02ae5c0, 0x47b13c7a, 0x4ebc3774, 0x55ab2a66, 0x5ca62168, 0x63851042, 0x6a881b4c, 0x719f065e, 0x78920d50, 0x0fd9640a, 0x06d46f04, 0x1dc37216, 0x14ce7918, 0x2bed4832, 0x22e0433c, 0x39f75e2e, 0x30fa5520, 0x9ab701ec, 0x93ba0ae2, 0x88ad17f0, 0x81a01cfe, 0xbe832dd4, 0xb78e26da, 0xac993bc8, 0xa59430c6, 0xd2df599c, 0xdbd25292, 0xc0c54f80, 0xc9c8448e, 0xf6eb75a4, 0xffe67eaa, 0xe4f163b8, 0xedfc68b6, 0x0a67b10c, 0x036aba02, 0x187da710, 0x1170ac1e, 0x2e539d34, 0x275e963a, 0x3c498b28, 0x35448026, 0x420fe97c, 0x4b02e272, 0x5015ff60, 0x5918f46e, 0x663bc544, 0x6f36ce4a, 0x7421d358, 0x7d2cd856, 0xa10c7a37, 0xa8017139, 0xb3166c2b, 0xba1b6725, 0x8538560f, 0x8c355d01, 0x97224013, 0x9e2f4b1d, 0xe9642247, 0xe0692949, 0xfb7e345b, 0xf2733f55, 0xcd500e7f, 0xc45d0571, 0xdf4a1863, 0xd647136d, 0x31dccad7, 0x38d1c1d9, 0x23c6dccb, 0x2acbd7c5, 0x15e8e6ef, 0x1ce5ede1, 0x07f2f0f3, 0x0efffbfd, 0x79b492a7, 0x70b999a9, 0x6bae84bb, 0x62a38fb5, 0x5d80be9f, 0x548db591, 0x4f9aa883, 0x4697a38d];

    function convertToInt32(bytes) {
        var result = [];
        for (var i = 0; i < bytes.length; i += 4) {
            result.push(
                (bytes[i    ] << 24) |
                (bytes[i + 1] << 16) |
                (bytes[i + 2] <<  8) |
                 bytes[i + 3]
            );
        }
        return result;
    }

    var AES = function(key) {
        if (!(this instanceof AES)) {
            throw Error('AES must be instanitated with `new`');
        }

        Object.defineProperty(this, 'key', {
            value: coerceArray(key, true)
        });

        this._prepare();
    }


    AES.prototype._prepare = function() {

        var rounds = numberOfRounds[this.key.length];
        if (rounds == null) {
            throw new Error('invalid key size (must be 16, 24 or 32 bytes)');
        }

        // encryption round keys
        this._Ke = [];

        // decryption round keys
        this._Kd = [];

        for (var i = 0; i <= rounds; i++) {
            this._Ke.push([0, 0, 0, 0]);
            this._Kd.push([0, 0, 0, 0]);
        }

        var roundKeyCount = (rounds + 1) * 4;
        var KC = this.key.length / 4;

        // convert the key into ints
        var tk = convertToInt32(this.key);

        // copy values into round key arrays
        var index;
        for (var i = 0; i < KC; i++) {
            index = i >> 2;
            this._Ke[index][i % 4] = tk[i];
            this._Kd[rounds - index][i % 4] = tk[i];
        }

        // key expansion (fips-197 section 5.2)
        var rconpointer = 0;
        var t = KC, tt;
        while (t < roundKeyCount) {
            tt = tk[KC - 1];
            tk[0] ^= ((S[(tt >> 16) & 0xFF] << 24) ^
                      (S[(tt >>  8) & 0xFF] << 16) ^
                      (S[ tt        & 0xFF] <<  8) ^
                       S[(tt >> 24) & 0xFF]        ^
                      (rcon[rconpointer] << 24));
            rconpointer += 1;

            // key expansion (for non-256 bit)
            if (KC != 8) {
                for (var i = 1; i < KC; i++) {
                    tk[i] ^= tk[i - 1];
                }

            // key expansion for 256-bit keys is "slightly different" (fips-197)
            } else {
                for (var i = 1; i < (KC / 2); i++) {
                    tk[i] ^= tk[i - 1];
                }
                tt = tk[(KC / 2) - 1];

                tk[KC / 2] ^= (S[ tt        & 0xFF]        ^
                              (S[(tt >>  8) & 0xFF] <<  8) ^
                              (S[(tt >> 16) & 0xFF] << 16) ^
                              (S[(tt >> 24) & 0xFF] << 24));

                for (var i = (KC / 2) + 1; i < KC; i++) {
                    tk[i] ^= tk[i - 1];
                }
            }

            // copy values into round key arrays
            var i = 0, r, c;
            while (i < KC && t < roundKeyCount) {
                r = t >> 2;
                c = t % 4;
                this._Ke[r][c] = tk[i];
                this._Kd[rounds - r][c] = tk[i++];
                t++;
            }
        }

        // inverse-cipher-ify the decryption round key (fips-197 section 5.3)
        for (var r = 1; r < rounds; r++) {
            for (var c = 0; c < 4; c++) {
                tt = this._Kd[r][c];
                this._Kd[r][c] = (U1[(tt >> 24) & 0xFF] ^
                                  U2[(tt >> 16) & 0xFF] ^
                                  U3[(tt >>  8) & 0xFF] ^
                                  U4[ tt        & 0xFF]);
            }
        }
    }

    AES.prototype.encrypt = function(plaintext) {
        if (plaintext.length != 16) {
            throw new Error('invalid plaintext size (must be 16 bytes)');
        }

        var rounds = this._Ke.length - 1;
        var a = [0, 0, 0, 0];

        // convert plaintext to (ints ^ key)
        var t = convertToInt32(plaintext);
        for (var i = 0; i < 4; i++) {
            t[i] ^= this._Ke[0][i];
        }

        // apply round transforms
        for (var r = 1; r < rounds; r++) {
            for (var i = 0; i < 4; i++) {
                a[i] = (T1[(t[ i         ] >> 24) & 0xff] ^
                        T2[(t[(i + 1) % 4] >> 16) & 0xff] ^
                        T3[(t[(i + 2) % 4] >>  8) & 0xff] ^
                        T4[ t[(i + 3) % 4]        & 0xff] ^
                        this._Ke[r][i]);
            }
            t = a.slice();
        }

        // the last round is special
        var result = createArray(16), tt;
        for (var i = 0; i < 4; i++) {
            tt = this._Ke[rounds][i];
            result[4 * i    ] = (S[(t[ i         ] >> 24) & 0xff] ^ (tt >> 24)) & 0xff;
            result[4 * i + 1] = (S[(t[(i + 1) % 4] >> 16) & 0xff] ^ (tt >> 16)) & 0xff;
            result[4 * i + 2] = (S[(t[(i + 2) % 4] >>  8) & 0xff] ^ (tt >>  8)) & 0xff;
            result[4 * i + 3] = (S[ t[(i + 3) % 4]        & 0xff] ^  tt       ) & 0xff;
        }

        return result;
    }

    AES.prototype.decrypt = function(ciphertext) {
        if (ciphertext.length != 16) {
            throw new Error('invalid ciphertext size (must be 16 bytes)');
        }

        var rounds = this._Kd.length - 1;
        var a = [0, 0, 0, 0];

        // convert plaintext to (ints ^ key)
        var t = convertToInt32(ciphertext);
        for (var i = 0; i < 4; i++) {
            t[i] ^= this._Kd[0][i];
        }

        // apply round transforms
        for (var r = 1; r < rounds; r++) {
            for (var i = 0; i < 4; i++) {
                a[i] = (T5[(t[ i          ] >> 24) & 0xff] ^
                        T6[(t[(i + 3) % 4] >> 16) & 0xff] ^
                        T7[(t[(i + 2) % 4] >>  8) & 0xff] ^
                        T8[ t[(i + 1) % 4]        & 0xff] ^
                        this._Kd[r][i]);
            }
            t = a.slice();
        }

        // the last round is special
        var result = createArray(16), tt;
        for (var i = 0; i < 4; i++) {
            tt = this._Kd[rounds][i];
            result[4 * i    ] = (Si[(t[ i         ] >> 24) & 0xff] ^ (tt >> 24)) & 0xff;
            result[4 * i + 1] = (Si[(t[(i + 3) % 4] >> 16) & 0xff] ^ (tt >> 16)) & 0xff;
            result[4 * i + 2] = (Si[(t[(i + 2) % 4] >>  8) & 0xff] ^ (tt >>  8)) & 0xff;
            result[4 * i + 3] = (Si[ t[(i + 1) % 4]        & 0xff] ^  tt       ) & 0xff;
        }

        return result;
    }


    /**
     *  Mode Of Operation - Electonic Codebook (ECB)
     */
    var ModeOfOperationECB = function(key) {
        if (!(this instanceof ModeOfOperationECB)) {
            throw Error('AES must be instanitated with `new`');
        }

        this.description = "Electronic Code Block";
        this.name = "ecb";

        this._aes = new AES(key);
    }

    ModeOfOperationECB.prototype.encrypt = function(plaintext) {
        plaintext = coerceArray(plaintext);

        if ((plaintext.length % 16) !== 0) {
            throw new Error('invalid plaintext size (must be multiple of 16 bytes)');
        }

        var ciphertext = createArray(plaintext.length);
        var block = createArray(16);

        for (var i = 0; i < plaintext.length; i += 16) {
            copyArray(plaintext, block, 0, i, i + 16);
            block = this._aes.encrypt(block);
            copyArray(block, ciphertext, i);
        }

        return ciphertext;
    }

    ModeOfOperationECB.prototype.decrypt = function(ciphertext) {
        ciphertext = coerceArray(ciphertext);

        if ((ciphertext.length % 16) !== 0) {
            throw new Error('invalid ciphertext size (must be multiple of 16 bytes)');
        }

        var plaintext = createArray(ciphertext.length);
        var block = createArray(16);

        for (var i = 0; i < ciphertext.length; i += 16) {
            copyArray(ciphertext, block, 0, i, i + 16);
            block = this._aes.decrypt(block);
            copyArray(block, plaintext, i);
        }

        return plaintext;
    }


    /**
     *  Mode Of Operation - Cipher Block Chaining (CBC)
     */
    var ModeOfOperationCBC = function(key, iv) {
        if (!(this instanceof ModeOfOperationCBC)) {
            throw Error('AES must be instanitated with `new`');
        }

        this.description = "Cipher Block Chaining";
        this.name = "cbc";

        if (!iv) {
            iv = createArray(16);

        } else if (iv.length != 16) {
            throw new Error('invalid initialation vector size (must be 16 bytes)');
        }

        this._lastCipherblock = coerceArray(iv, true);

        this._aes = new AES(key);
    }

    ModeOfOperationCBC.prototype.encrypt = function(plaintext) {
        plaintext = coerceArray(plaintext);

        if ((plaintext.length % 16) !== 0) {
            throw new Error('invalid plaintext size (must be multiple of 16 bytes)');
        }

        var ciphertext = createArray(plaintext.length);
        var block = createArray(16);

        for (var i = 0; i < plaintext.length; i += 16) {
            copyArray(plaintext, block, 0, i, i + 16);

            for (var j = 0; j < 16; j++) {
                block[j] ^= this._lastCipherblock[j];
            }

            this._lastCipherblock = this._aes.encrypt(block);
            copyArray(this._lastCipherblock, ciphertext, i);
        }

        return ciphertext;
    }

    ModeOfOperationCBC.prototype.decrypt = function(ciphertext) {
        ciphertext = coerceArray(ciphertext);

        if ((ciphertext.length % 16) !== 0) {
            throw new Error('invalid ciphertext size (must be multiple of 16 bytes)');
        }

        var plaintext = createArray(ciphertext.length);
        var block = createArray(16);

        for (var i = 0; i < ciphertext.length; i += 16) {
            copyArray(ciphertext, block, 0, i, i + 16);
            block = this._aes.decrypt(block);

            for (var j = 0; j < 16; j++) {
                plaintext[i + j] = block[j] ^ this._lastCipherblock[j];
            }

            copyArray(ciphertext, this._lastCipherblock, 0, i, i + 16);
        }

        return plaintext;
    }


    /**
     *  Mode Of Operation - Cipher Feedback (CFB)
     */
    var ModeOfOperationCFB = function(key, iv, segmentSize) {
        if (!(this instanceof ModeOfOperationCFB)) {
            throw Error('AES must be instanitated with `new`');
        }

        this.description = "Cipher Feedback";
        this.name = "cfb";

        if (!iv) {
            iv = createArray(16);

        } else if (iv.length != 16) {
            throw new Error('invalid initialation vector size (must be 16 size)');
        }

        if (!segmentSize) { segmentSize = 1; }

        this.segmentSize = segmentSize;

        this._shiftRegister = coerceArray(iv, true);

        this._aes = new AES(key);
    }

    ModeOfOperationCFB.prototype.encrypt = function(plaintext) {
        if ((plaintext.length % this.segmentSize) != 0) {
            throw new Error('invalid plaintext size (must be segmentSize bytes)');
        }

        var encrypted = coerceArray(plaintext, true);

        var xorSegment;
        for (var i = 0; i < encrypted.length; i += this.segmentSize) {
            xorSegment = this._aes.encrypt(this._shiftRegister);
            for (var j = 0; j < this.segmentSize; j++) {
                encrypted[i + j] ^= xorSegment[j];
            }

            // Shift the register
            copyArray(this._shiftRegister, this._shiftRegister, 0, this.segmentSize);
            copyArray(encrypted, this._shiftRegister, 16 - this.segmentSize, i, i + this.segmentSize);
        }

        return encrypted;
    }

    ModeOfOperationCFB.prototype.decrypt = function(ciphertext) {
        if ((ciphertext.length % this.segmentSize) != 0) {
            throw new Error('invalid ciphertext size (must be segmentSize bytes)');
        }

        var plaintext = coerceArray(ciphertext, true);

        var xorSegment;
        for (var i = 0; i < plaintext.length; i += this.segmentSize) {
            xorSegment = this._aes.encrypt(this._shiftRegister);

            for (var j = 0; j < this.segmentSize; j++) {
                plaintext[i + j] ^= xorSegment[j];
            }

            // Shift the register
            copyArray(this._shiftRegister, this._shiftRegister, 0, this.segmentSize);
            copyArray(ciphertext, this._shiftRegister, 16 - this.segmentSize, i, i + this.segmentSize);
        }

        return plaintext;
    }

    /**
     *  Mode Of Operation - Output Feedback (OFB)
     */
    var ModeOfOperationOFB = function(key, iv) {
        if (!(this instanceof ModeOfOperationOFB)) {
            throw Error('AES must be instanitated with `new`');
        }

        this.description = "Output Feedback";
        this.name = "ofb";

        if (!iv) {
            iv = createArray(16);

        } else if (iv.length != 16) {
            throw new Error('invalid initialation vector size (must be 16 bytes)');
        }

        this._lastPrecipher = coerceArray(iv, true);
        this._lastPrecipherIndex = 16;

        this._aes = new AES(key);
    }

    ModeOfOperationOFB.prototype.encrypt = function(plaintext) {
        var encrypted = coerceArray(plaintext, true);

        for (var i = 0; i < encrypted.length; i++) {
            if (this._lastPrecipherIndex === 16) {
                this._lastPrecipher = this._aes.encrypt(this._lastPrecipher);
                this._lastPrecipherIndex = 0;
            }
            encrypted[i] ^= this._lastPrecipher[this._lastPrecipherIndex++];
        }

        return encrypted;
    }

    // Decryption is symetric
    ModeOfOperationOFB.prototype.decrypt = ModeOfOperationOFB.prototype.encrypt;


    /**
     *  Counter object for CTR common mode of operation
     */
    var Counter = function(initialValue) {
        if (!(this instanceof Counter)) {
            throw Error('Counter must be instanitated with `new`');
        }

        // We allow 0, but anything false-ish uses the default 1
        if (initialValue !== 0 && !initialValue) { initialValue = 1; }

        if (typeof(initialValue) === 'number') {
            this._counter = createArray(16);
            this.setValue(initialValue);

        } else {
            this.setBytes(initialValue);
        }
    }

    Counter.prototype.setValue = function(value) {
        if (typeof(value) !== 'number' || parseInt(value) != value) {
            throw new Error('invalid counter value (must be an integer)');
        }

        // We cannot safely handle numbers beyond the safe range for integers
        if (value > Number.MAX_SAFE_INTEGER) {
            throw new Error('integer value out of safe range');
        }

        for (var index = 15; index >= 0; --index) {
            this._counter[index] = value % 256;
            value = parseInt(value / 256);
        }
    }

    Counter.prototype.setBytes = function(bytes) {
        bytes = coerceArray(bytes, true);

        if (bytes.length != 16) {
            throw new Error('invalid counter bytes size (must be 16 bytes)');
        }

        this._counter = bytes;
    };

    Counter.prototype.increment = function() {
        for (var i = 15; i >= 0; i--) {
            if (this._counter[i] === 255) {
                this._counter[i] = 0;
            } else {
                this._counter[i]++;
                break;
            }
        }
    }


    /**
     *  Mode Of Operation - Counter (CTR)
     */
    var ModeOfOperationCTR = function(key, counter) {
        if (!(this instanceof ModeOfOperationCTR)) {
            throw Error('AES must be instanitated with `new`');
        }

        this.description = "Counter";
        this.name = "ctr";

        if (!(counter instanceof Counter)) {
            counter = new Counter(counter)
        }

        this._counter = counter;

        this._remainingCounter = null;
        this._remainingCounterIndex = 16;

        this._aes = new AES(key);
    }

    ModeOfOperationCTR.prototype.encrypt = function(plaintext) {
        var encrypted = coerceArray(plaintext, true);

        for (var i = 0; i < encrypted.length; i++) {
            if (this._remainingCounterIndex === 16) {
                this._remainingCounter = this._aes.encrypt(this._counter._counter);
                this._remainingCounterIndex = 0;
                this._counter.increment();
            }
            encrypted[i] ^= this._remainingCounter[this._remainingCounterIndex++];
        }

        return encrypted;
    }

    // Decryption is symetric
    ModeOfOperationCTR.prototype.decrypt = ModeOfOperationCTR.prototype.encrypt;


    ///////////////////////
    // Padding

    // See:https://tools.ietf.org/html/rfc2315
    function pkcs7pad(data) {
        data = coerceArray(data, true);
        var padder = 16 - (data.length % 16);
        var result = createArray(data.length + padder);
        copyArray(data, result);
        for (var i = data.length; i < result.length; i++) {
            result[i] = padder;
        }
        return result;
    }

    function pkcs7strip(data) {
        data = coerceArray(data, true);
        if (data.length < 16) { throw new Error('PKCS#7 invalid length'); }

        var padder = data[data.length - 1];
        if (padder > 16) { throw new Error('PKCS#7 padding byte out of range'); }

        var length = data.length - padder;
        for (var i = 0; i < padder; i++) {
            if (data[length + i] !== padder) {
                throw new Error('PKCS#7 invalid padding byte');
            }
        }

        var result = createArray(length);
        copyArray(data, result, 0, 0, length);
        return result;
    }

    ///////////////////////
    // Exporting


    // The block cipher
    var aesjs = {
        AES: AES,
        Counter: Counter,

        ModeOfOperation: {
            ecb: ModeOfOperationECB,
            cbc: ModeOfOperationCBC,
            cfb: ModeOfOperationCFB,
            ofb: ModeOfOperationOFB,
            ctr: ModeOfOperationCTR
        },

        utils: {
            hex: convertHex,
            utf8: convertUtf8
        },

        padding: {
            pkcs7: {
                pad: pkcs7pad,
                strip: pkcs7strip
            }
        },

        _arrayTest: {
            coerceArray: coerceArray,
            createArray: createArray,
            copyArray: copyArray,
        }
    };


    // node.js
    if (true) {
        module.exports = aesjs

    // RequireJS/AMD
    // http://www.requirejs.org/docs/api.html
    // https://github.com/amdjs/amdjs-api/wiki/AMD
    } else {}


})(this);


/***/ }),

/***/ "../node_modules/asap/browser-asap.js":
/*!********************************************!*\
  !*** ../node_modules/asap/browser-asap.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// rawAsap provides everything we need except exception management.
var rawAsap = __webpack_require__(/*! ./raw */ "../node_modules/asap/browser-raw.js");
// RawTasks are recycled to reduce GC churn.
var freeTasks = [];
// We queue errors to ensure they are thrown in right order (FIFO).
// Array-as-queue is good enough here, since we are just dealing with exceptions.
var pendingErrors = [];
var requestErrorThrow = rawAsap.makeRequestCallFromTimer(throwFirstError);

function throwFirstError() {
    if (pendingErrors.length) {
        throw pendingErrors.shift();
    }
}

/**
 * Calls a task as soon as possible after returning, in its own event, with priority
 * over other events like animation, reflow, and repaint. An error thrown from an
 * event will not interrupt, nor even substantially slow down the processing of
 * other events, but will be rather postponed to a lower priority event.
 * @param {{call}} task A callable object, typically a function that takes no
 * arguments.
 */
module.exports = asap;
function asap(task) {
    var rawTask;
    if (freeTasks.length) {
        rawTask = freeTasks.pop();
    } else {
        rawTask = new RawTask();
    }
    rawTask.task = task;
    rawAsap(rawTask);
}

// We wrap tasks with recyclable task objects.  A task object implements
// `call`, just like a function.
function RawTask() {
    this.task = null;
}

// The sole purpose of wrapping the task is to catch the exception and recycle
// the task object after its single use.
RawTask.prototype.call = function () {
    try {
        this.task.call();
    } catch (error) {
        if (asap.onerror) {
            // This hook exists purely for testing purposes.
            // Its name will be periodically randomized to break any code that
            // depends on its existence.
            asap.onerror(error);
        } else {
            // In a web browser, exceptions are not fatal. However, to avoid
            // slowing down the queue of pending tasks, we rethrow the error in a
            // lower priority turn.
            pendingErrors.push(error);
            requestErrorThrow();
        }
    } finally {
        this.task = null;
        freeTasks[freeTasks.length] = this;
    }
};


/***/ }),

/***/ "../node_modules/asap/browser-raw.js":
/*!*******************************************!*\
  !*** ../node_modules/asap/browser-raw.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

// Use the fastest means possible to execute a task in its own turn, with
// priority over other events including IO, animation, reflow, and redraw
// events in browsers.
//
// An exception thrown by a task will permanently interrupt the processing of
// subsequent tasks. The higher level `asap` function ensures that if an
// exception is thrown by a task, that the task queue will continue flushing as
// soon as possible, but if you use `rawAsap` directly, you are responsible to
// either ensure that no exceptions are thrown from your task, or to manually
// call `rawAsap.requestFlush` if an exception is thrown.
module.exports = rawAsap;
function rawAsap(task) {
    if (!queue.length) {
        requestFlush();
        flushing = true;
    }
    // Equivalent to push, but avoids a function call.
    queue[queue.length] = task;
}

var queue = [];
// Once a flush has been requested, no further calls to `requestFlush` are
// necessary until the next `flush` completes.
var flushing = false;
// `requestFlush` is an implementation-specific method that attempts to kick
// off a `flush` event as quickly as possible. `flush` will attempt to exhaust
// the event queue before yielding to the browser's own event loop.
var requestFlush;
// The position of the next task to execute in the task queue. This is
// preserved between calls to `flush` so that it can be resumed if
// a task throws an exception.
var index = 0;
// If a task schedules additional tasks recursively, the task queue can grow
// unbounded. To prevent memory exhaustion, the task queue will periodically
// truncate already-completed tasks.
var capacity = 1024;

// The flush function processes all tasks that have been scheduled with
// `rawAsap` unless and until one of those tasks throws an exception.
// If a task throws an exception, `flush` ensures that its state will remain
// consistent and will resume where it left off when called again.
// However, `flush` does not make any arrangements to be called again if an
// exception is thrown.
function flush() {
    while (index < queue.length) {
        var currentIndex = index;
        // Advance the index before calling the task. This ensures that we will
        // begin flushing on the next task the task throws an error.
        index = index + 1;
        queue[currentIndex].call();
        // Prevent leaking memory for long chains of recursive calls to `asap`.
        // If we call `asap` within tasks scheduled by `asap`, the queue will
        // grow, but to avoid an O(n) walk for every task we execute, we don't
        // shift tasks off the queue after they have been executed.
        // Instead, we periodically shift 1024 tasks off the queue.
        if (index > capacity) {
            // Manually shift all values starting at the index back to the
            // beginning of the queue.
            for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
                queue[scan] = queue[scan + index];
            }
            queue.length -= index;
            index = 0;
        }
    }
    queue.length = 0;
    index = 0;
    flushing = false;
}

// `requestFlush` is implemented using a strategy based on data collected from
// every available SauceLabs Selenium web driver worker at time of writing.
// https://docs.google.com/spreadsheets/d/1mG-5UYGup5qxGdEMWkhP6BWCz053NUb2E1QoUTU16uA/edit#gid=783724593

// Safari 6 and 6.1 for desktop, iPad, and iPhone are the only browsers that
// have WebKitMutationObserver but not un-prefixed MutationObserver.
// Must use `global` or `self` instead of `window` to work in both frames and web
// workers. `global` is a provision of Browserify, Mr, Mrs, or Mop.

/* globals self */
var scope = typeof global !== "undefined" ? global : self;
var BrowserMutationObserver = scope.MutationObserver || scope.WebKitMutationObserver;

// MutationObservers are desirable because they have high priority and work
// reliably everywhere they are implemented.
// They are implemented in all modern browsers.
//
// - Android 4-4.3
// - Chrome 26-34
// - Firefox 14-29
// - Internet Explorer 11
// - iPad Safari 6-7.1
// - iPhone Safari 7-7.1
// - Safari 6-7
if (typeof BrowserMutationObserver === "function") {
    requestFlush = makeRequestCallFromMutationObserver(flush);

// MessageChannels are desirable because they give direct access to the HTML
// task queue, are implemented in Internet Explorer 10, Safari 5.0-1, and Opera
// 11-12, and in web workers in many engines.
// Although message channels yield to any queued rendering and IO tasks, they
// would be better than imposing the 4ms delay of timers.
// However, they do not work reliably in Internet Explorer or Safari.

// Internet Explorer 10 is the only browser that has setImmediate but does
// not have MutationObservers.
// Although setImmediate yields to the browser's renderer, it would be
// preferrable to falling back to setTimeout since it does not have
// the minimum 4ms penalty.
// Unfortunately there appears to be a bug in Internet Explorer 10 Mobile (and
// Desktop to a lesser extent) that renders both setImmediate and
// MessageChannel useless for the purposes of ASAP.
// https://github.com/kriskowal/q/issues/396

// Timers are implemented universally.
// We fall back to timers in workers in most engines, and in foreground
// contexts in the following browsers.
// However, note that even this simple case requires nuances to operate in a
// broad spectrum of browsers.
//
// - Firefox 3-13
// - Internet Explorer 6-9
// - iPad Safari 4.3
// - Lynx 2.8.7
} else {
    requestFlush = makeRequestCallFromTimer(flush);
}

// `requestFlush` requests that the high priority event queue be flushed as
// soon as possible.
// This is useful to prevent an error thrown in a task from stalling the event
// queue if the exception handled by Node.js’s
// `process.on("uncaughtException")` or by a domain.
rawAsap.requestFlush = requestFlush;

// To request a high priority event, we induce a mutation observer by toggling
// the text of a text node between "1" and "-1".
function makeRequestCallFromMutationObserver(callback) {
    var toggle = 1;
    var observer = new BrowserMutationObserver(callback);
    var node = document.createTextNode("");
    observer.observe(node, {characterData: true});
    return function requestCall() {
        toggle = -toggle;
        node.data = toggle;
    };
}

// The message channel technique was discovered by Malte Ubl and was the
// original foundation for this library.
// http://www.nonblocking.io/2011/06/windownexttick.html

// Safari 6.0.5 (at least) intermittently fails to create message ports on a
// page's first load. Thankfully, this version of Safari supports
// MutationObservers, so we don't need to fall back in that case.

// function makeRequestCallFromMessageChannel(callback) {
//     var channel = new MessageChannel();
//     channel.port1.onmessage = callback;
//     return function requestCall() {
//         channel.port2.postMessage(0);
//     };
// }

// For reasons explained above, we are also unable to use `setImmediate`
// under any circumstances.
// Even if we were, there is another bug in Internet Explorer 10.
// It is not sufficient to assign `setImmediate` to `requestFlush` because
// `setImmediate` must be called *by name* and therefore must be wrapped in a
// closure.
// Never forget.

// function makeRequestCallFromSetImmediate(callback) {
//     return function requestCall() {
//         setImmediate(callback);
//     };
// }

// Safari 6.0 has a problem where timers will get lost while the user is
// scrolling. This problem does not impact ASAP because Safari 6.0 supports
// mutation observers, so that implementation is used instead.
// However, if we ever elect to use timers in Safari, the prevalent work-around
// is to add a scroll event listener that calls for a flush.

// `setTimeout` does not call the passed callback if the delay is less than
// approximately 7 in web workers in Firefox 8 through 18, and sometimes not
// even then.

function makeRequestCallFromTimer(callback) {
    return function requestCall() {
        // We dispatch a timeout with a specified delay of 0 for engines that
        // can reliably accommodate that request. This will usually be snapped
        // to a 4 milisecond delay, but once we're flushing, there's no delay
        // between events.
        var timeoutHandle = setTimeout(handleTimer, 0);
        // However, since this timer gets frequently dropped in Firefox
        // workers, we enlist an interval handle that will try to fire
        // an event 20 times per second until it succeeds.
        var intervalHandle = setInterval(handleTimer, 50);

        function handleTimer() {
            // Whichever timer succeeds will cancel both timers and
            // execute the callback.
            clearTimeout(timeoutHandle);
            clearInterval(intervalHandle);
            callback();
        }
    };
}

// This is for `asap.js` only.
// Its name will be periodically randomized to break any code that depends on
// its existence.
rawAsap.makeRequestCallFromTimer = makeRequestCallFromTimer;

// ASAP was originally a nextTick shim included in Q. This was factored out
// into this ASAP package. It was later adapted to RSVP which made further
// amendments. These decisions, particularly to marginalize MessageChannel and
// to capture the MutationObserver implementation in a closure, were integrated
// back into ASAP proper.
// https://github.com/tildeio/rsvp.js/blob/cddf7232546a9cf858524b75cde6f9edf72620a7/lib/rsvp/asap.js

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/global.js */ "../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "../node_modules/promise/index.js":
/*!****************************************!*\
  !*** ../node_modules/promise/index.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = __webpack_require__(/*! ./lib */ "../node_modules/promise/lib/index.js")


/***/ }),

/***/ "../node_modules/promise/lib/core.js":
/*!*******************************************!*\
  !*** ../node_modules/promise/lib/core.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var asap = __webpack_require__(/*! asap/raw */ "../node_modules/asap/browser-raw.js");

function noop() {}

// States:
//
// 0 - pending
// 1 - fulfilled with _value
// 2 - rejected with _value
// 3 - adopted the state of another promise, _value
//
// once the state is no longer pending (0) it is immutable

// All `_` prefixed properties will be reduced to `_{random number}`
// at build time to obfuscate them and discourage their use.
// We don't use symbols or Object.defineProperty to fully hide them
// because the performance isn't good enough.


// to avoid using try/catch inside critical functions, we
// extract them to here.
var LAST_ERROR = null;
var IS_ERROR = {};
function getThen(obj) {
  try {
    return obj.then;
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

function tryCallOne(fn, a) {
  try {
    return fn(a);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}
function tryCallTwo(fn, a, b) {
  try {
    fn(a, b);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

module.exports = Promise;

function Promise(fn) {
  if (typeof this !== 'object') {
    throw new TypeError('Promises must be constructed via new');
  }
  if (typeof fn !== 'function') {
    throw new TypeError('Promise constructor\'s argument is not a function');
  }
  this._U = 0;
  this._V = 0;
  this._W = null;
  this._X = null;
  if (fn === noop) return;
  doResolve(fn, this);
}
Promise._Y = null;
Promise._Z = null;
Promise._0 = noop;

Promise.prototype.then = function(onFulfilled, onRejected) {
  if (this.constructor !== Promise) {
    return safeThen(this, onFulfilled, onRejected);
  }
  var res = new Promise(noop);
  handle(this, new Handler(onFulfilled, onRejected, res));
  return res;
};

function safeThen(self, onFulfilled, onRejected) {
  return new self.constructor(function (resolve, reject) {
    var res = new Promise(noop);
    res.then(resolve, reject);
    handle(self, new Handler(onFulfilled, onRejected, res));
  });
}
function handle(self, deferred) {
  while (self._V === 3) {
    self = self._W;
  }
  if (Promise._Y) {
    Promise._Y(self);
  }
  if (self._V === 0) {
    if (self._U === 0) {
      self._U = 1;
      self._X = deferred;
      return;
    }
    if (self._U === 1) {
      self._U = 2;
      self._X = [self._X, deferred];
      return;
    }
    self._X.push(deferred);
    return;
  }
  handleResolved(self, deferred);
}

function handleResolved(self, deferred) {
  asap(function() {
    var cb = self._V === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      if (self._V === 1) {
        resolve(deferred.promise, self._W);
      } else {
        reject(deferred.promise, self._W);
      }
      return;
    }
    var ret = tryCallOne(cb, self._W);
    if (ret === IS_ERROR) {
      reject(deferred.promise, LAST_ERROR);
    } else {
      resolve(deferred.promise, ret);
    }
  });
}
function resolve(self, newValue) {
  // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
  if (newValue === self) {
    return reject(
      self,
      new TypeError('A promise cannot be resolved with itself.')
    );
  }
  if (
    newValue &&
    (typeof newValue === 'object' || typeof newValue === 'function')
  ) {
    var then = getThen(newValue);
    if (then === IS_ERROR) {
      return reject(self, LAST_ERROR);
    }
    if (
      then === self.then &&
      newValue instanceof Promise
    ) {
      self._V = 3;
      self._W = newValue;
      finale(self);
      return;
    } else if (typeof then === 'function') {
      doResolve(then.bind(newValue), self);
      return;
    }
  }
  self._V = 1;
  self._W = newValue;
  finale(self);
}

function reject(self, newValue) {
  self._V = 2;
  self._W = newValue;
  if (Promise._Z) {
    Promise._Z(self, newValue);
  }
  finale(self);
}
function finale(self) {
  if (self._U === 1) {
    handle(self, self._X);
    self._X = null;
  }
  if (self._U === 2) {
    for (var i = 0; i < self._X.length; i++) {
      handle(self, self._X[i]);
    }
    self._X = null;
  }
}

function Handler(onFulfilled, onRejected, promise){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, promise) {
  var done = false;
  var res = tryCallTwo(fn, function (value) {
    if (done) return;
    done = true;
    resolve(promise, value);
  }, function (reason) {
    if (done) return;
    done = true;
    reject(promise, reason);
  });
  if (!done && res === IS_ERROR) {
    done = true;
    reject(promise, LAST_ERROR);
  }
}


/***/ }),

/***/ "../node_modules/promise/lib/done.js":
/*!*******************************************!*\
  !*** ../node_modules/promise/lib/done.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Promise = __webpack_require__(/*! ./core.js */ "../node_modules/promise/lib/core.js");

module.exports = Promise;
Promise.prototype.done = function (onFulfilled, onRejected) {
  var self = arguments.length ? this.then.apply(this, arguments) : this;
  self.then(null, function (err) {
    setTimeout(function () {
      throw err;
    }, 0);
  });
};


/***/ }),

/***/ "../node_modules/promise/lib/es6-extensions.js":
/*!*****************************************************!*\
  !*** ../node_modules/promise/lib/es6-extensions.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


//This file contains the ES6 extensions to the core Promises/A+ API

var Promise = __webpack_require__(/*! ./core.js */ "../node_modules/promise/lib/core.js");

module.exports = Promise;

/* Static Functions */

var TRUE = valuePromise(true);
var FALSE = valuePromise(false);
var NULL = valuePromise(null);
var UNDEFINED = valuePromise(undefined);
var ZERO = valuePromise(0);
var EMPTYSTRING = valuePromise('');

function valuePromise(value) {
  var p = new Promise(Promise._0);
  p._V = 1;
  p._W = value;
  return p;
}
Promise.resolve = function (value) {
  if (value instanceof Promise) return value;

  if (value === null) return NULL;
  if (value === undefined) return UNDEFINED;
  if (value === true) return TRUE;
  if (value === false) return FALSE;
  if (value === 0) return ZERO;
  if (value === '') return EMPTYSTRING;

  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then;
      if (typeof then === 'function') {
        return new Promise(then.bind(value));
      }
    } catch (ex) {
      return new Promise(function (resolve, reject) {
        reject(ex);
      });
    }
  }
  return valuePromise(value);
};

var iterableToArray = function (iterable) {
  if (typeof Array.from === 'function') {
    // ES2015+, iterables exist
    iterableToArray = Array.from;
    return Array.from(iterable);
  }

  // ES5, only arrays and array-likes exist
  iterableToArray = function (x) { return Array.prototype.slice.call(x); };
  return Array.prototype.slice.call(iterable);
}

Promise.all = function (arr) {
  var args = iterableToArray(arr);

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([]);
    var remaining = args.length;
    function res(i, val) {
      if (val && (typeof val === 'object' || typeof val === 'function')) {
        if (val instanceof Promise && val.then === Promise.prototype.then) {
          while (val._V === 3) {
            val = val._W;
          }
          if (val._V === 1) return res(i, val._W);
          if (val._V === 2) reject(val._W);
          val.then(function (val) {
            res(i, val);
          }, reject);
          return;
        } else {
          var then = val.then;
          if (typeof then === 'function') {
            var p = new Promise(then.bind(val));
            p.then(function (val) {
              res(i, val);
            }, reject);
            return;
          }
        }
      }
      args[i] = val;
      if (--remaining === 0) {
        resolve(args);
      }
    }
    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) {
    reject(value);
  });
};

Promise.race = function (values) {
  return new Promise(function (resolve, reject) {
    iterableToArray(values).forEach(function(value){
      Promise.resolve(value).then(resolve, reject);
    });
  });
};

/* Prototype Methods */

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
};


/***/ }),

/***/ "../node_modules/promise/lib/finally.js":
/*!**********************************************!*\
  !*** ../node_modules/promise/lib/finally.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Promise = __webpack_require__(/*! ./core.js */ "../node_modules/promise/lib/core.js");

module.exports = Promise;
Promise.prototype.finally = function (f) {
  return this.then(function (value) {
    return Promise.resolve(f()).then(function () {
      return value;
    });
  }, function (err) {
    return Promise.resolve(f()).then(function () {
      throw err;
    });
  });
};


/***/ }),

/***/ "../node_modules/promise/lib/index.js":
/*!********************************************!*\
  !*** ../node_modules/promise/lib/index.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = __webpack_require__(/*! ./core.js */ "../node_modules/promise/lib/core.js");
__webpack_require__(/*! ./done.js */ "../node_modules/promise/lib/done.js");
__webpack_require__(/*! ./finally.js */ "../node_modules/promise/lib/finally.js");
__webpack_require__(/*! ./es6-extensions.js */ "../node_modules/promise/lib/es6-extensions.js");
__webpack_require__(/*! ./node-extensions.js */ "../node_modules/promise/lib/node-extensions.js");
__webpack_require__(/*! ./synchronous.js */ "../node_modules/promise/lib/synchronous.js");


/***/ }),

/***/ "../node_modules/promise/lib/node-extensions.js":
/*!******************************************************!*\
  !*** ../node_modules/promise/lib/node-extensions.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// This file contains then/promise specific extensions that are only useful
// for node.js interop

var Promise = __webpack_require__(/*! ./core.js */ "../node_modules/promise/lib/core.js");
var asap = __webpack_require__(/*! asap */ "../node_modules/asap/browser-asap.js");

module.exports = Promise;

/* Static Functions */

Promise.denodeify = function (fn, argumentCount) {
  if (
    typeof argumentCount === 'number' && argumentCount !== Infinity
  ) {
    return denodeifyWithCount(fn, argumentCount);
  } else {
    return denodeifyWithoutCount(fn);
  }
};

var callbackFn = (
  'function (err, res) {' +
  'if (err) { rj(err); } else { rs(res); }' +
  '}'
);
function denodeifyWithCount(fn, argumentCount) {
  var args = [];
  for (var i = 0; i < argumentCount; i++) {
    args.push('a' + i);
  }
  var body = [
    'return function (' + args.join(',') + ') {',
    'var self = this;',
    'return new Promise(function (rs, rj) {',
    'var res = fn.call(',
    ['self'].concat(args).concat([callbackFn]).join(','),
    ');',
    'if (res &&',
    '(typeof res === "object" || typeof res === "function") &&',
    'typeof res.then === "function"',
    ') {rs(res);}',
    '});',
    '};'
  ].join('');
  return Function(['Promise', 'fn'], body)(Promise, fn);
}
function denodeifyWithoutCount(fn) {
  var fnLength = Math.max(fn.length - 1, 3);
  var args = [];
  for (var i = 0; i < fnLength; i++) {
    args.push('a' + i);
  }
  var body = [
    'return function (' + args.join(',') + ') {',
    'var self = this;',
    'var args;',
    'var argLength = arguments.length;',
    'if (arguments.length > ' + fnLength + ') {',
    'args = new Array(arguments.length + 1);',
    'for (var i = 0; i < arguments.length; i++) {',
    'args[i] = arguments[i];',
    '}',
    '}',
    'return new Promise(function (rs, rj) {',
    'var cb = ' + callbackFn + ';',
    'var res;',
    'switch (argLength) {',
    args.concat(['extra']).map(function (_, index) {
      return (
        'case ' + (index) + ':' +
        'res = fn.call(' + ['self'].concat(args.slice(0, index)).concat('cb').join(',') + ');' +
        'break;'
      );
    }).join(''),
    'default:',
    'args[argLength] = cb;',
    'res = fn.apply(self, args);',
    '}',
    
    'if (res &&',
    '(typeof res === "object" || typeof res === "function") &&',
    'typeof res.then === "function"',
    ') {rs(res);}',
    '});',
    '};'
  ].join('');

  return Function(
    ['Promise', 'fn'],
    body
  )(Promise, fn);
}

Promise.nodeify = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    var callback =
      typeof args[args.length - 1] === 'function' ? args.pop() : null;
    var ctx = this;
    try {
      return fn.apply(this, arguments).nodeify(callback, ctx);
    } catch (ex) {
      if (callback === null || typeof callback == 'undefined') {
        return new Promise(function (resolve, reject) {
          reject(ex);
        });
      } else {
        asap(function () {
          callback.call(ctx, ex);
        })
      }
    }
  }
};

Promise.prototype.nodeify = function (callback, ctx) {
  if (typeof callback != 'function') return this;

  this.then(function (value) {
    asap(function () {
      callback.call(ctx, null, value);
    });
  }, function (err) {
    asap(function () {
      callback.call(ctx, err);
    });
  });
};


/***/ }),

/***/ "../node_modules/promise/lib/synchronous.js":
/*!**************************************************!*\
  !*** ../node_modules/promise/lib/synchronous.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Promise = __webpack_require__(/*! ./core.js */ "../node_modules/promise/lib/core.js");

module.exports = Promise;
Promise.enableSynchronous = function () {
  Promise.prototype.isPending = function() {
    return this.getState() == 0;
  };

  Promise.prototype.isFulfilled = function() {
    return this.getState() == 1;
  };

  Promise.prototype.isRejected = function() {
    return this.getState() == 2;
  };

  Promise.prototype.getValue = function () {
    if (this._V === 3) {
      return this._W.getValue();
    }

    if (!this.isFulfilled()) {
      throw new Error('Cannot get a value of an unfulfilled promise.');
    }

    return this._W;
  };

  Promise.prototype.getReason = function () {
    if (this._V === 3) {
      return this._W.getReason();
    }

    if (!this.isRejected()) {
      throw new Error('Cannot get a rejection reason of a non-rejected promise.');
    }

    return this._W;
  };

  Promise.prototype.getState = function () {
    if (this._V === 3) {
      return this._W.getState();
    }
    if (this._V === -1 || this._V === -2) {
      return 0;
    }

    return this._V;
  };
};

Promise.disableSynchronous = function() {
  Promise.prototype.isPending = undefined;
  Promise.prototype.isFulfilled = undefined;
  Promise.prototype.isRejected = undefined;
  Promise.prototype.getValue = undefined;
  Promise.prototype.getReason = undefined;
  Promise.prototype.getState = undefined;
};


/***/ }),

/***/ "../node_modules/webpack/buildin/global.js":
/*!*************************************************!*\
  !*** ../node_modules/webpack/buildin/global.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ "../node_modules/whatwg-fetch/fetch.js":
/*!*********************************************!*\
  !*** ../node_modules/whatwg-fetch/fetch.js ***!
  \*********************************************/
/*! exports provided: Headers, Request, Response, DOMException, fetch */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Headers", function() { return Headers; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Request", function() { return Request; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Response", function() { return Response; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DOMException", function() { return DOMException; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "fetch", function() { return fetch; });
var support = {
  searchParams: 'URLSearchParams' in self,
  iterable: 'Symbol' in self && 'iterator' in Symbol,
  blob:
    'FileReader' in self &&
    'Blob' in self &&
    (function() {
      try {
        new Blob()
        return true
      } catch (e) {
        return false
      }
    })(),
  formData: 'FormData' in self,
  arrayBuffer: 'ArrayBuffer' in self
}

function isDataView(obj) {
  return obj && DataView.prototype.isPrototypeOf(obj)
}

if (support.arrayBuffer) {
  var viewClasses = [
    '[object Int8Array]',
    '[object Uint8Array]',
    '[object Uint8ClampedArray]',
    '[object Int16Array]',
    '[object Uint16Array]',
    '[object Int32Array]',
    '[object Uint32Array]',
    '[object Float32Array]',
    '[object Float64Array]'
  ]

  var isArrayBufferView =
    ArrayBuffer.isView ||
    function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    }
}

function normalizeName(name) {
  if (typeof name !== 'string') {
    name = String(name)
  }
  if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
    throw new TypeError('Invalid character in header field name')
  }
  return name.toLowerCase()
}

function normalizeValue(value) {
  if (typeof value !== 'string') {
    value = String(value)
  }
  return value
}

// Build a destructive iterator for the value list
function iteratorFor(items) {
  var iterator = {
    next: function() {
      var value = items.shift()
      return {done: value === undefined, value: value}
    }
  }

  if (support.iterable) {
    iterator[Symbol.iterator] = function() {
      return iterator
    }
  }

  return iterator
}

function Headers(headers) {
  this.map = {}

  if (headers instanceof Headers) {
    headers.forEach(function(value, name) {
      this.append(name, value)
    }, this)
  } else if (Array.isArray(headers)) {
    headers.forEach(function(header) {
      this.append(header[0], header[1])
    }, this)
  } else if (headers) {
    Object.getOwnPropertyNames(headers).forEach(function(name) {
      this.append(name, headers[name])
    }, this)
  }
}

Headers.prototype.append = function(name, value) {
  name = normalizeName(name)
  value = normalizeValue(value)
  var oldValue = this.map[name]
  this.map[name] = oldValue ? oldValue + ', ' + value : value
}

Headers.prototype['delete'] = function(name) {
  delete this.map[normalizeName(name)]
}

Headers.prototype.get = function(name) {
  name = normalizeName(name)
  return this.has(name) ? this.map[name] : null
}

Headers.prototype.has = function(name) {
  return this.map.hasOwnProperty(normalizeName(name))
}

Headers.prototype.set = function(name, value) {
  this.map[normalizeName(name)] = normalizeValue(value)
}

Headers.prototype.forEach = function(callback, thisArg) {
  for (var name in this.map) {
    if (this.map.hasOwnProperty(name)) {
      callback.call(thisArg, this.map[name], name, this)
    }
  }
}

Headers.prototype.keys = function() {
  var items = []
  this.forEach(function(value, name) {
    items.push(name)
  })
  return iteratorFor(items)
}

Headers.prototype.values = function() {
  var items = []
  this.forEach(function(value) {
    items.push(value)
  })
  return iteratorFor(items)
}

Headers.prototype.entries = function() {
  var items = []
  this.forEach(function(value, name) {
    items.push([name, value])
  })
  return iteratorFor(items)
}

if (support.iterable) {
  Headers.prototype[Symbol.iterator] = Headers.prototype.entries
}

function consumed(body) {
  if (body.bodyUsed) {
    return Promise.reject(new TypeError('Already read'))
  }
  body.bodyUsed = true
}

function fileReaderReady(reader) {
  return new Promise(function(resolve, reject) {
    reader.onload = function() {
      resolve(reader.result)
    }
    reader.onerror = function() {
      reject(reader.error)
    }
  })
}

function readBlobAsArrayBuffer(blob) {
  var reader = new FileReader()
  var promise = fileReaderReady(reader)
  reader.readAsArrayBuffer(blob)
  return promise
}

function readBlobAsText(blob) {
  var reader = new FileReader()
  var promise = fileReaderReady(reader)
  reader.readAsText(blob)
  return promise
}

function readArrayBufferAsText(buf) {
  var view = new Uint8Array(buf)
  var chars = new Array(view.length)

  for (var i = 0; i < view.length; i++) {
    chars[i] = String.fromCharCode(view[i])
  }
  return chars.join('')
}

function bufferClone(buf) {
  if (buf.slice) {
    return buf.slice(0)
  } else {
    var view = new Uint8Array(buf.byteLength)
    view.set(new Uint8Array(buf))
    return view.buffer
  }
}

function Body() {
  this.bodyUsed = false

  this._initBody = function(body) {
    this._bodyInit = body
    if (!body) {
      this._bodyText = ''
    } else if (typeof body === 'string') {
      this._bodyText = body
    } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
      this._bodyBlob = body
    } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
      this._bodyFormData = body
    } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
      this._bodyText = body.toString()
    } else if (support.arrayBuffer && support.blob && isDataView(body)) {
      this._bodyArrayBuffer = bufferClone(body.buffer)
      // IE 10-11 can't handle a DataView body.
      this._bodyInit = new Blob([this._bodyArrayBuffer])
    } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
      this._bodyArrayBuffer = bufferClone(body)
    } else {
      this._bodyText = body = Object.prototype.toString.call(body)
    }

    if (!this.headers.get('content-type')) {
      if (typeof body === 'string') {
        this.headers.set('content-type', 'text/plain;charset=UTF-8')
      } else if (this._bodyBlob && this._bodyBlob.type) {
        this.headers.set('content-type', this._bodyBlob.type)
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
      }
    }
  }

  if (support.blob) {
    this.blob = function() {
      var rejected = consumed(this)
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return Promise.resolve(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(new Blob([this._bodyArrayBuffer]))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as blob')
      } else {
        return Promise.resolve(new Blob([this._bodyText]))
      }
    }

    this.arrayBuffer = function() {
      if (this._bodyArrayBuffer) {
        return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
      } else {
        return this.blob().then(readBlobAsArrayBuffer)
      }
    }
  }

  this.text = function() {
    var rejected = consumed(this)
    if (rejected) {
      return rejected
    }

    if (this._bodyBlob) {
      return readBlobAsText(this._bodyBlob)
    } else if (this._bodyArrayBuffer) {
      return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
    } else if (this._bodyFormData) {
      throw new Error('could not read FormData body as text')
    } else {
      return Promise.resolve(this._bodyText)
    }
  }

  if (support.formData) {
    this.formData = function() {
      return this.text().then(decode)
    }
  }

  this.json = function() {
    return this.text().then(JSON.parse)
  }

  return this
}

// HTTP methods whose capitalization should be normalized
var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

function normalizeMethod(method) {
  var upcased = method.toUpperCase()
  return methods.indexOf(upcased) > -1 ? upcased : method
}

function Request(input, options) {
  options = options || {}
  var body = options.body

  if (input instanceof Request) {
    if (input.bodyUsed) {
      throw new TypeError('Already read')
    }
    this.url = input.url
    this.credentials = input.credentials
    if (!options.headers) {
      this.headers = new Headers(input.headers)
    }
    this.method = input.method
    this.mode = input.mode
    this.signal = input.signal
    if (!body && input._bodyInit != null) {
      body = input._bodyInit
      input.bodyUsed = true
    }
  } else {
    this.url = String(input)
  }

  this.credentials = options.credentials || this.credentials || 'same-origin'
  if (options.headers || !this.headers) {
    this.headers = new Headers(options.headers)
  }
  this.method = normalizeMethod(options.method || this.method || 'GET')
  this.mode = options.mode || this.mode || null
  this.signal = options.signal || this.signal
  this.referrer = null

  if ((this.method === 'GET' || this.method === 'HEAD') && body) {
    throw new TypeError('Body not allowed for GET or HEAD requests')
  }
  this._initBody(body)
}

Request.prototype.clone = function() {
  return new Request(this, {body: this._bodyInit})
}

function decode(body) {
  var form = new FormData()
  body
    .trim()
    .split('&')
    .forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
  return form
}

function parseHeaders(rawHeaders) {
  var headers = new Headers()
  // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
  // https://tools.ietf.org/html/rfc7230#section-3.2
  var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ')
  preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
    var parts = line.split(':')
    var key = parts.shift().trim()
    if (key) {
      var value = parts.join(':').trim()
      headers.append(key, value)
    }
  })
  return headers
}

Body.call(Request.prototype)

function Response(bodyInit, options) {
  if (!options) {
    options = {}
  }

  this.type = 'default'
  this.status = options.status === undefined ? 200 : options.status
  this.ok = this.status >= 200 && this.status < 300
  this.statusText = 'statusText' in options ? options.statusText : 'OK'
  this.headers = new Headers(options.headers)
  this.url = options.url || ''
  this._initBody(bodyInit)
}

Body.call(Response.prototype)

Response.prototype.clone = function() {
  return new Response(this._bodyInit, {
    status: this.status,
    statusText: this.statusText,
    headers: new Headers(this.headers),
    url: this.url
  })
}

Response.error = function() {
  var response = new Response(null, {status: 0, statusText: ''})
  response.type = 'error'
  return response
}

var redirectStatuses = [301, 302, 303, 307, 308]

Response.redirect = function(url, status) {
  if (redirectStatuses.indexOf(status) === -1) {
    throw new RangeError('Invalid status code')
  }

  return new Response(null, {status: status, headers: {location: url}})
}

var DOMException = self.DOMException
try {
  new DOMException()
} catch (err) {
  DOMException = function(message, name) {
    this.message = message
    this.name = name
    var error = Error(message)
    this.stack = error.stack
  }
  DOMException.prototype = Object.create(Error.prototype)
  DOMException.prototype.constructor = DOMException
}

function fetch(input, init) {
  return new Promise(function(resolve, reject) {
    var request = new Request(input, init)

    if (request.signal && request.signal.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'))
    }

    var xhr = new XMLHttpRequest()

    function abortXhr() {
      xhr.abort()
    }

    xhr.onload = function() {
      var options = {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: parseHeaders(xhr.getAllResponseHeaders() || '')
      }
      options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL')
      var body = 'response' in xhr ? xhr.response : xhr.responseText
      resolve(new Response(body, options))
    }

    xhr.onerror = function() {
      reject(new TypeError('Network request failed'))
    }

    xhr.ontimeout = function() {
      reject(new TypeError('Network request failed'))
    }

    xhr.onabort = function() {
      reject(new DOMException('Aborted', 'AbortError'))
    }

    xhr.open(request.method, request.url, true)

    if (request.credentials === 'include') {
      xhr.withCredentials = true
    } else if (request.credentials === 'omit') {
      xhr.withCredentials = false
    }

    if ('responseType' in xhr && support.blob) {
      xhr.responseType = 'blob'
    }

    request.headers.forEach(function(value, name) {
      xhr.setRequestHeader(name, value)
    })

    if (request.signal) {
      request.signal.addEventListener('abort', abortXhr)

      xhr.onreadystatechange = function() {
        // DONE (success or failure)
        if (xhr.readyState === 4) {
          request.signal.removeEventListener('abort', abortXhr)
        }
      }
    }

    xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
  })
}

fetch.polyfill = true

if (!self.fetch) {
  self.fetch = fetch
  self.Headers = Headers
  self.Request = Request
  self.Response = Response
}


/***/ }),

/***/ "./index.js":
/*!******************!*\
  !*** ./index.js ***!
  \******************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(/*! whatwg-fetch */ "../node_modules/whatwg-fetch/fetch.js");

var _rsa = __webpack_require__(/*! ./rsa.js */ "./rsa.js");

var _rsa2 = _interopRequireDefault(_rsa);

var _promise = __webpack_require__(/*! promise */ "../node_modules/promise/index.js");

var _promise2 = _interopRequireDefault(_promise);

var _aesJs = __webpack_require__(/*! aes-js */ "../node_modules/aes-js/index.js");

var _aesJs2 = _interopRequireDefault(_aesJs);

var _keyNumbers = __webpack_require__(/*! ./keyNumbers.js */ "./keyNumbers.js");

var _keyNumbers2 = _interopRequireDefault(_keyNumbers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function () {
    var getParam = function getParam(url, key, opt_default) {
        if (opt_default === undefined) opt_default = "";
        var parts = url.split("?");
        if (parts.length < 2) return opt_default;
        var value = RegExp("" + key + "[^&]+").exec(parts[1]);
        // Return the unescaped value minus everything starting from the equals sign or an empty string
        return decodeURIComponent(!!value ? value.toString().replace(/^[^=]+./, "") : opt_default);
    };
    var storageKey = "avnav.ochartProvider.sessionId";
    var scriptKey = "ochartsProvider";
    var currentKey = undefined;
    var currentEntryptedKey = undefined;
    var currentCounter = undefined;
    var currentSequence = undefined;
    var baseUrl = undefined;
    if (!window.avnav) window.avnav = {};
    var script = document.currentScript;
    if (script) {
        var url = script.getAttribute('src');
        if (url) {
            baseUrl = url.replace(/\?.*/, '');
            var sk = getParam(url, "scriptKey");
            if (sk) {
                scriptKey = sk;
                storageKey = "avnav.ochartProvider.sessionId." + sk;
            }
        }
    }
    var currentSessionId = localStorage.getItem(storageKey);
    /**
     decrypt RSA
     */
    var decrypt = function decrypt(value) {
        var key = new _rsa2.default();
        key.setPrivateEx(_keyNumbers2.default.N, _keyNumbers2.default.E, _keyNumbers2.default.D, _keyNumbers2.default.P, _keyNumbers2.default.Q, _keyNumbers2.default.DP, _keyNumbers2.default.DQ, _keyNumbers2.default.C);
        var rt = key.decryptBuffer(value.replace(/:/g, ""));
        return rt;
    };
    /**
     * encrypt AES
     */
    var encrypt = function encrypt(value) {
        try {
            if (!currentKey) return "nokey";
            var aesCtr = new _aesJs2.default.ModeOfOperation.ctr(currentKey, currentCounter);
            var encryptedBytes = aesCtr.encrypt(_aesJs2.default.utils.utf8.toBytes(value));
            return _aesJs2.default.utils.hex.fromBytes(encryptedBytes);
        } catch (e) {
            console.log("encrypt error");
        }
    };
    var getBaseUrl = function getBaseUrl() {
        if (baseUrl) return baseUrl;
        var el = document.getElementById(scriptKey);
        if (el) {
            var _url = el.getAttribute('src');
            if (_url) {
                baseUrl = _url.replace(/\?.*/, '');
            }
        }
        return baseUrl;
    };
    var fetchKey = function fetchKey() {
        return new _promise2.default(function (resolve, reject) {
            var url = getBaseUrl();
            if (url == undefined) {
                reject("no url");
                return;
            }
            url = url + "?request=key";
            currentSessionId = localStorage.getItem(storageKey);
            if (currentSessionId !== undefined) {
                url += "&sessionId=" + encodeURIComponent(currentSessionId);
            }
            var options = {};
            var headers = {};
            headers['pragma'] = 'no-cache';
            headers['cache-control'] = 'no-cache';
            options.headers = headers;
            fetch(url, options).then(function (response) {
                if (response.status < 200 || response.status >= 300) {
                    reject(response.statusText);
                    return;
                }
                if (response.ok) {
                    return response.json();
                } else {
                    reject(response.statusText);
                    return;
                }
            }).then(function (json) {
                if (!json.status || json.status != 'OK') {
                    reject(json.status || "no status");
                    return;
                }
                resolve(json.data);
                return;
            }).catch(function (error) {
                reject(error);
            });
        });
    };
    window.avnav[scriptKey] = {
        heartBeat: function heartBeat() {
            return new _promise2.default(function (resolve, reject) {
                fetchKey().then(function (jsonData) {
                    if (jsonData.sequence != currentSequence || jsonData.key != currentEntryptedKey || currentSessionId != jsonData.sessionId) {
                        currentKey = decrypt(jsonData.key);
                        if (currentKey == null) {
                            currentKey = undefined;
                            reject("unable to decrypt key");
                            return;
                        }
                        if (currentKey.length != 16) {
                            currentKey = undefined;
                            reject("invalid key length received");
                            return;
                        }
                        currentSessionId = jsonData.sessionId;
                        if (localStorage.getItem(storageKey) != currentSessionId) {
                            localStorage.setItem(storageKey, currentSessionId);
                        }
                        currentSequence = jsonData.sequence;
                        currentEntryptedKey = jsonData.key;
                        currentCounter = new _aesJs2.default.Counter(new Date().getTime());
                    }
                    resolve(0);
                }).catch(function (error) {
                    reject(error);
                });
            });
        },
        encryptUrl: function encryptUrl(urlPart) {
            if (!currentKey) return;
            return "encrypted/" + currentSessionId + "/" + currentSequence + "/" + _aesJs2.default.utils.hex.fromBytes(currentCounter._counter) + "/" + encrypt(urlPart);
        }
    };
})();

/***/ }),

/***/ "./keyNumbers.js":
/*!***********************!*\
  !*** ./keyNumbers.js ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var key = {
    N: "f3e3b219af4d99928043fa6087cf2306bf24e1d77b228e7d4d39d852d448d63a332d55728749ac6d17f7c9cf0ce0797a21e4f516dd58f14078a3cc95d104dfb171a56930533370042777c727e17cf9b379315d13d18ec2837786cb74dcef5515562416d992f228aed2f3748f6b4e73f06fc1d0c7f30e8990349675afe44a640f9059ce6591221914de090fcbcb295a852aee97f70aaab1f489b6d803fdf1bec276563fdc533049727bcb3221632e366a079145d78f8e793195b0288fa612071a3fa237c221def25930ca239f19f4a4d789fa6b553950fa11f8cecd3f48fe40214b8a37b95842e8efdffd1e3ea60561a7db5fba2458eb52382e9fd8a1990b699f",
    E: "10001",
    D: "6f0fbd46dd01a571855f6f610df751a7fcdb3accf991def9487593010512b61b82ba9e32ad50eb683285f02c8d5c9b74f68260e9ac9a982217cddf9849bac272f7a1afa905fa628441c4d5b85f829de310c95ded6c7c6a2f9bfa922401882b62affb773c5522594c635be2347d55188ee1158d91c0295a93849f0fb0ad7102e6ffedfe9c140311013bbeedd12bb275c43ee6719e030e0342a2dd78f5d550da04d125b02e05d26cedb034575cabf4f53e09239db2507b47c72c41797e9cd3e3f94231031ad3dcf622993f085fa67ce4bde232aa09cbf9aeb0d4159a2ffbc5393b3a618b3760729806b2164a4c0a51f5cc333b62b59385c74d2bf8c48743017bc1",
    P: "fa4b2ffddcbb5ddcf12791c364acf6ba0c6cdc61c8f9176d640ffdf734c4cc6da41e0d57763a4138b22b1845ca7a8fc6aa298996dea96c06001a511eaa470466c3afe4573ec778ce59c5029722736eccfaaeb160ed6b836562c9b99a49ed011b25b36b4997327bd0b54be48eb901e3d81c38903f4ba5addcf667a522417d77e7",
    Q: "f9732163bc8196b54b45650d918418efb0954937d1e7e636ce1655077b7881bd7aab32eee751c2176e8b6a2c44eecb4aaed0165f84c192243dc6a6f5450fbae93b6bc74160f2f32e68cbf3a5e118307e44a0f46ae51a50ab6546baddccc188091a190a76dc0cf4eaa6d2e1c2b066e43f74f97a61c18468868fc4391fd273e989",
    DP: "16614ab5445b6c9528eb04d997d2ef6ccb57a08d0dcf580cebf99217dc9c0c3b71854e6417aa35d2bffba27bfb12e2703d1ee1b29fce3e5e7afbdf6d0284bf1c013b650b780d95fbbd83242c276472efd92a6da9e110cffaecce64ce2af60a374733b7d028b8d6e15e949ea7345bbae7c3fe3ac7ae17ee67e79074ef8f338cd9",
    DQ: "d0396c9bc6951dea83c48f8ffdf218a6abee51ca08abdd1dce7611d0471ed69e0631b6387a5b62fb1049cbfcdc25c108bc57f2f514ea48457c53c0b66849b32a5171ac4844d7486b6b0b247d49225a086cdd3669ac8884e22d8e171a627b024526c5d45857637166168f5de8983bab37d53b130f5aec5e1c4511f4e53d558891",
    C: "12f5921ded944796d591263651855dbd41a7b9aab85e84aeaa7d274691b00bbe612a69a3c9b864bd3116a94496f23ba216314a20af0283d04f28982034596dbe278131d1460e8d4ad2eb33b9aafbbceed3a124d6079ad86e5dd88b08d83c7943f76779f31a0a255d7dc48cf5e30dd05d4e2be64945396a689576443214a44786"
};
module.exports = key;

/***/ }),

/***/ "./rsa.js":
/*!****************!*\
  !*** ./rsa.js ***!
  \****************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * taken from http://www-cs-students.stanford.edu/~tjw/jsbn/
 * BSD license
  This software is covered under the following copyright:

 * Copyright (c) 2003-2005  Tom Wu
 * All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY
 * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
 *
 * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
 * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
 * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
 * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
 * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * In addition, the following condition applies:
 *
 * All redistributions must retain an intact copy of this copyright notice
 * and disclaimer.

    Address all questions regarding this license to:

    Tom Wu
    tjw@cs.Stanford.EDU
 *
 *
 */

/**
 * all necessary files collected into this file
 */

//------------------------------ jsbn.js -------------------------------------------
// Copyright (c) 2005  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.

// Basic JavaScript BN library - subset useful for RSA encryption.

// Bits per digit
var dbits;

// JavaScript engine analysis
var canary = 0xdeadbeefcafe;
var j_lm = (canary & 0xffffff) == 0xefcafe;

// (public) Constructor
function BigInteger(a, b, c) {
    if (a != null) if ("number" == typeof a) this.fromNumber(a, b, c);else if (b == null && "string" != typeof a) this.fromString(a, 256);else this.fromString(a, b);
}

// return new, unset BigInteger
function nbi() {
    return new BigInteger(null);
}

// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.

// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
function am1(i, x, w, j, c, n) {
    while (--n >= 0) {
        var v = x * this[i++] + w[j] + c;
        c = Math.floor(v / 0x4000000);
        w[j++] = v & 0x3ffffff;
    }
    return c;
}
// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
function am2(i, x, w, j, c, n) {
    var xl = x & 0x7fff,
        xh = x >> 15;
    while (--n >= 0) {
        var l = this[i] & 0x7fff;
        var h = this[i++] >> 15;
        var m = xh * l + h * xl;
        l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff);
        c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
        w[j++] = l & 0x3fffffff;
    }
    return c;
}
// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
function am3(i, x, w, j, c, n) {
    var xl = x & 0x3fff,
        xh = x >> 14;
    while (--n >= 0) {
        var l = this[i] & 0x3fff;
        var h = this[i++] >> 14;
        var m = xh * l + h * xl;
        l = xl * l + ((m & 0x3fff) << 14) + w[j] + c;
        c = (l >> 28) + (m >> 14) + xh * h;
        w[j++] = l & 0xfffffff;
    }
    return c;
}
if (j_lm && navigator.appName == "Microsoft Internet Explorer") {
    BigInteger.prototype.am = am2;
    dbits = 30;
} else if (j_lm && navigator.appName != "Netscape") {
    BigInteger.prototype.am = am1;
    dbits = 26;
} else {
    // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
}

BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = (1 << dbits) - 1;
BigInteger.prototype.DV = 1 << dbits;

var BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2, BI_FP);
BigInteger.prototype.F1 = BI_FP - dbits;
BigInteger.prototype.F2 = 2 * dbits - BI_FP;

// Digit conversions
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
var BI_RC = new Array();
var rr, vv;
rr = "0".charCodeAt(0);
for (vv = 0; vv <= 9; ++vv) {
    BI_RC[rr++] = vv;
}rr = "a".charCodeAt(0);
for (vv = 10; vv < 36; ++vv) {
    BI_RC[rr++] = vv;
}rr = "A".charCodeAt(0);
for (vv = 10; vv < 36; ++vv) {
    BI_RC[rr++] = vv;
}function int2char(n) {
    return BI_RM.charAt(n);
}
function intAt(s, i) {
    var c = BI_RC[s.charCodeAt(i)];
    return c == null ? -1 : c;
}

// (protected) copy this to r
function bnpCopyTo(r) {
    for (var i = this.t - 1; i >= 0; --i) {
        r[i] = this[i];
    }r.t = this.t;
    r.s = this.s;
}

// (protected) set from integer value x, -DV <= x < DV
function bnpFromInt(x) {
    this.t = 1;
    this.s = x < 0 ? -1 : 0;
    if (x > 0) this[0] = x;else if (x < -1) this[0] = x + this.DV;else this.t = 0;
}

// return bigint initialized to value
function nbv(i) {
    var r = nbi();r.fromInt(i);return r;
}

// (protected) set from string and radix
function bnpFromString(s, b) {
    var k;
    if (b == 16) k = 4;else if (b == 8) k = 3;else if (b == 256) k = 8; // byte array
    else if (b == 2) k = 1;else if (b == 32) k = 5;else if (b == 4) k = 2;else {
            this.fromRadix(s, b);return;
        }
    this.t = 0;
    this.s = 0;
    var i = s.length,
        mi = false,
        sh = 0;
    while (--i >= 0) {
        var x = k == 8 ? s[i] & 0xff : intAt(s, i);
        if (x < 0) {
            if (s.charAt(i) == "-") mi = true;
            continue;
        }
        mi = false;
        if (sh == 0) this[this.t++] = x;else if (sh + k > this.DB) {
            this[this.t - 1] |= (x & (1 << this.DB - sh) - 1) << sh;
            this[this.t++] = x >> this.DB - sh;
        } else this[this.t - 1] |= x << sh;
        sh += k;
        if (sh >= this.DB) sh -= this.DB;
    }
    if (k == 8 && (s[0] & 0x80) != 0) {
        this.s = -1;
        if (sh > 0) this[this.t - 1] |= (1 << this.DB - sh) - 1 << sh;
    }
    this.clamp();
    if (mi) BigInteger.ZERO.subTo(this, this);
}

// (protected) clamp off excess high words
function bnpClamp() {
    var c = this.s & this.DM;
    while (this.t > 0 && this[this.t - 1] == c) {
        --this.t;
    }
}

// (public) return string representation in given radix
function bnToString(b) {
    if (this.s < 0) return "-" + this.negate().toString(b);
    var k;
    if (b == 16) k = 4;else if (b == 8) k = 3;else if (b == 2) k = 1;else if (b == 32) k = 5;else if (b == 4) k = 2;else return this.toRadix(b);
    var km = (1 << k) - 1,
        d,
        m = false,
        r = "",
        i = this.t;
    var p = this.DB - i * this.DB % k;
    if (i-- > 0) {
        if (p < this.DB && (d = this[i] >> p) > 0) {
            m = true;r = int2char(d);
        }
        while (i >= 0) {
            if (p < k) {
                d = (this[i] & (1 << p) - 1) << k - p;
                d |= this[--i] >> (p += this.DB - k);
            } else {
                d = this[i] >> (p -= k) & km;
                if (p <= 0) {
                    p += this.DB;--i;
                }
            }
            if (d > 0) m = true;
            if (m) r += int2char(d);
        }
    }
    return m ? r : "0";
}

// (public) -this
function bnNegate() {
    var r = nbi();BigInteger.ZERO.subTo(this, r);return r;
}

// (public) |this|
function bnAbs() {
    return this.s < 0 ? this.negate() : this;
}

// (public) return + if this > a, - if this < a, 0 if equal
function bnCompareTo(a) {
    var r = this.s - a.s;
    if (r != 0) return r;
    var i = this.t;
    r = i - a.t;
    if (r != 0) return this.s < 0 ? -r : r;
    while (--i >= 0) {
        if ((r = this[i] - a[i]) != 0) return r;
    }return 0;
}

// returns bit length of the integer x
function nbits(x) {
    var r = 1,
        t;
    if ((t = x >>> 16) != 0) {
        x = t;r += 16;
    }
    if ((t = x >> 8) != 0) {
        x = t;r += 8;
    }
    if ((t = x >> 4) != 0) {
        x = t;r += 4;
    }
    if ((t = x >> 2) != 0) {
        x = t;r += 2;
    }
    if ((t = x >> 1) != 0) {
        x = t;r += 1;
    }
    return r;
}

// (public) return the number of bits in "this"
function bnBitLength() {
    if (this.t <= 0) return 0;
    return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ this.s & this.DM);
}

// (protected) r = this << n*DB
function bnpDLShiftTo(n, r) {
    var i;
    for (i = this.t - 1; i >= 0; --i) {
        r[i + n] = this[i];
    }for (i = n - 1; i >= 0; --i) {
        r[i] = 0;
    }r.t = this.t + n;
    r.s = this.s;
}

// (protected) r = this >> n*DB
function bnpDRShiftTo(n, r) {
    for (var i = n; i < this.t; ++i) {
        r[i - n] = this[i];
    }r.t = Math.max(this.t - n, 0);
    r.s = this.s;
}

// (protected) r = this << n
function bnpLShiftTo(n, r) {
    var bs = n % this.DB;
    var cbs = this.DB - bs;
    var bm = (1 << cbs) - 1;
    var ds = Math.floor(n / this.DB),
        c = this.s << bs & this.DM,
        i;
    for (i = this.t - 1; i >= 0; --i) {
        r[i + ds + 1] = this[i] >> cbs | c;
        c = (this[i] & bm) << bs;
    }
    for (i = ds - 1; i >= 0; --i) {
        r[i] = 0;
    }r[ds] = c;
    r.t = this.t + ds + 1;
    r.s = this.s;
    r.clamp();
}

// (protected) r = this >> n
function bnpRShiftTo(n, r) {
    r.s = this.s;
    var ds = Math.floor(n / this.DB);
    if (ds >= this.t) {
        r.t = 0;return;
    }
    var bs = n % this.DB;
    var cbs = this.DB - bs;
    var bm = (1 << bs) - 1;
    r[0] = this[ds] >> bs;
    for (var i = ds + 1; i < this.t; ++i) {
        r[i - ds - 1] |= (this[i] & bm) << cbs;
        r[i - ds] = this[i] >> bs;
    }
    if (bs > 0) r[this.t - ds - 1] |= (this.s & bm) << cbs;
    r.t = this.t - ds;
    r.clamp();
}

// (protected) r = this - a
function bnpSubTo(a, r) {
    var i = 0,
        c = 0,
        m = Math.min(a.t, this.t);
    while (i < m) {
        c += this[i] - a[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
    }
    if (a.t < this.t) {
        c -= a.s;
        while (i < this.t) {
            c += this[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        c += this.s;
    } else {
        c += this.s;
        while (i < a.t) {
            c -= a[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        c -= a.s;
    }
    r.s = c < 0 ? -1 : 0;
    if (c < -1) r[i++] = this.DV + c;else if (c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
}

// (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.
function bnpMultiplyTo(a, r) {
    var x = this.abs(),
        y = a.abs();
    var i = x.t;
    r.t = i + y.t;
    while (--i >= 0) {
        r[i] = 0;
    }for (i = 0; i < y.t; ++i) {
        r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
    }r.s = 0;
    r.clamp();
    if (this.s != a.s) BigInteger.ZERO.subTo(r, r);
}

// (protected) r = this^2, r != this (HAC 14.16)
function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2 * x.t;
    while (--i >= 0) {
        r[i] = 0;
    }for (i = 0; i < x.t - 1; ++i) {
        var c = x.am(i, x[i], r, 2 * i, 0, 1);
        if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
            r[i + x.t] -= x.DV;
            r[i + x.t + 1] = 1;
        }
    }
    if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
    r.s = 0;
    r.clamp();
}

// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
function bnpDivRemTo(m, q, r) {
    var pm = m.abs();
    if (pm.t <= 0) return;
    var pt = this.abs();
    if (pt.t < pm.t) {
        if (q != null) q.fromInt(0);
        if (r != null) this.copyTo(r);
        return;
    }
    if (r == null) r = nbi();
    var y = nbi(),
        ts = this.s,
        ms = m.s;
    var nsh = this.DB - nbits(pm[pm.t - 1]); // normalize modulus
    if (nsh > 0) {
        pm.lShiftTo(nsh, y);pt.lShiftTo(nsh, r);
    } else {
        pm.copyTo(y);pt.copyTo(r);
    }
    var ys = y.t;
    var y0 = y[ys - 1];
    if (y0 == 0) return;
    var yt = y0 * (1 << this.F1) + (ys > 1 ? y[ys - 2] >> this.F2 : 0);
    var d1 = this.FV / yt,
        d2 = (1 << this.F1) / yt,
        e = 1 << this.F2;
    var i = r.t,
        j = i - ys,
        t = q == null ? nbi() : q;
    y.dlShiftTo(j, t);
    if (r.compareTo(t) >= 0) {
        r[r.t++] = 1;
        r.subTo(t, r);
    }
    BigInteger.ONE.dlShiftTo(ys, t);
    t.subTo(y, y); // "negative" y so we can replace sub with am later
    while (y.t < ys) {
        y[y.t++] = 0;
    }while (--j >= 0) {
        // Estimate quotient digit
        var qd = r[--i] == y0 ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
        if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {
            // Try it out
            y.dlShiftTo(j, t);
            r.subTo(t, r);
            while (r[i] < --qd) {
                r.subTo(t, r);
            }
        }
    }
    if (q != null) {
        r.drShiftTo(ys, q);
        if (ts != ms) BigInteger.ZERO.subTo(q, q);
    }
    r.t = ys;
    r.clamp();
    if (nsh > 0) r.rShiftTo(nsh, r); // Denormalize remainder
    if (ts < 0) BigInteger.ZERO.subTo(r, r);
}

// (public) this mod a
function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a, null, r);
    if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r, r);
    return r;
}

// Modular reduction using "classic" algorithm
function Classic(m) {
    this.m = m;
}
function cConvert(x) {
    if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);else return x;
}
function cRevert(x) {
    return x;
}
function cReduce(x) {
    x.divRemTo(this.m, null, x);
}
function cMulTo(x, y, r) {
    x.multiplyTo(y, r);this.reduce(r);
}
function cSqrTo(x, r) {
    x.squareTo(r);this.reduce(r);
}

Classic.prototype.convert = cConvert;
Classic.prototype.revert = cRevert;
Classic.prototype.reduce = cReduce;
Classic.prototype.mulTo = cMulTo;
Classic.prototype.sqrTo = cSqrTo;

// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.
function bnpInvDigit() {
    if (this.t < 1) return 0;
    var x = this[0];
    if ((x & 1) == 0) return 0;
    var y = x & 3; // y == 1/x mod 2^2
    y = y * (2 - (x & 0xf) * y) & 0xf; // y == 1/x mod 2^4
    y = y * (2 - (x & 0xff) * y) & 0xff; // y == 1/x mod 2^8
    y = y * (2 - ((x & 0xffff) * y & 0xffff)) & 0xffff; // y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = y * (2 - x * y % this.DV) % this.DV; // y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return y > 0 ? this.DV - y : -y;
}

// Montgomery reduction
function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp & 0x7fff;
    this.mph = this.mp >> 15;
    this.um = (1 << m.DB - 15) - 1;
    this.mt2 = 2 * m.t;
}

// xR mod m
function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t, r);
    r.divRemTo(this.m, null, r);
    if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r, r);
    return r;
}

// x/R mod m
function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
}

// x = x/R mod m (HAC 14.32)
function montReduce(x) {
    while (x.t <= this.mt2) {
        // pad x so am has enough room later
        x[x.t++] = 0;
    }for (var i = 0; i < this.m.t; ++i) {
        // faster way of calculating u0 = x[i]*mp mod DV
        var j = x[i] & 0x7fff;
        var u0 = j * this.mpl + ((j * this.mph + (x[i] >> 15) * this.mpl & this.um) << 15) & x.DM;
        // use am to combine the multiply-shift-add into one call
        j = i + this.m.t;
        x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
        // propagate carry
        while (x[j] >= x.DV) {
            x[j] -= x.DV;x[++j]++;
        }
    }
    x.clamp();
    x.drShiftTo(this.m.t, x);
    if (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
}

// r = "x^2/R mod m"; x != r
function montSqrTo(x, r) {
    x.squareTo(r);this.reduce(r);
}

// r = "xy/R mod m"; x,y != r
function montMulTo(x, y, r) {
    x.multiplyTo(y, r);this.reduce(r);
}

Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo;

// (protected) true iff this is even
function bnpIsEven() {
    return (this.t > 0 ? this[0] & 1 : this.s) == 0;
}

// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
function bnpExp(e, z) {
    if (e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(),
        r2 = nbi(),
        g = z.convert(this),
        i = nbits(e) - 1;
    g.copyTo(r);
    while (--i >= 0) {
        z.sqrTo(r, r2);
        if ((e & 1 << i) > 0) z.mulTo(r2, g, r);else {
            var t = r;r = r2;r2 = t;
        }
    }
    return z.revert(r);
}

// (public) this^e % m, 0 <= e < 2^32
function bnModPowInt(e, m) {
    var z;
    if (e < 256 || m.isEven()) z = new Classic(m);else z = new Montgomery(m);
    return this.exp(e, z);
}

// protected
BigInteger.prototype.copyTo = bnpCopyTo;
BigInteger.prototype.fromInt = bnpFromInt;
BigInteger.prototype.fromString = bnpFromString;
BigInteger.prototype.clamp = bnpClamp;
BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
BigInteger.prototype.drShiftTo = bnpDRShiftTo;
BigInteger.prototype.lShiftTo = bnpLShiftTo;
BigInteger.prototype.rShiftTo = bnpRShiftTo;
BigInteger.prototype.subTo = bnpSubTo;
BigInteger.prototype.multiplyTo = bnpMultiplyTo;
BigInteger.prototype.squareTo = bnpSquareTo;
BigInteger.prototype.divRemTo = bnpDivRemTo;
BigInteger.prototype.invDigit = bnpInvDigit;
BigInteger.prototype.isEven = bnpIsEven;
BigInteger.prototype.exp = bnpExp;

// public
BigInteger.prototype.toString = bnToString;
BigInteger.prototype.negate = bnNegate;
BigInteger.prototype.abs = bnAbs;
BigInteger.prototype.compareTo = bnCompareTo;
BigInteger.prototype.bitLength = bnBitLength;
BigInteger.prototype.mod = bnMod;
BigInteger.prototype.modPowInt = bnModPowInt;

// "constants"
BigInteger.ZERO = nbv(0);
BigInteger.ONE = nbv(1);

//------------------------------ jsbn2.js -------------------------------------------
// Copyright (c) 2005-2009  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.

// Extended JavaScript BN functions, required for RSA private ops.

// Version 1.1: new BigInteger("0", 10) returns "proper" zero
// Version 1.2: square() API, isProbablePrime fix

// (public)
function bnClone() {
    var r = nbi();this.copyTo(r);return r;
}

// (public) return value as integer
function bnIntValue() {
    if (this.s < 0) {
        if (this.t == 1) return this[0] - this.DV;else if (this.t == 0) return -1;
    } else if (this.t == 1) return this[0];else if (this.t == 0) return 0;
    // assumes 16 < DB < 32
    return (this[1] & (1 << 32 - this.DB) - 1) << this.DB | this[0];
}

// (public) return value as byte
function bnByteValue() {
    return this.t == 0 ? this.s : this[0] << 24 >> 24;
}

// (public) return value as short (assumes DB>=16)
function bnShortValue() {
    return this.t == 0 ? this.s : this[0] << 16 >> 16;
}

// (protected) return x s.t. r^x < DV
function bnpChunkSize(r) {
    return Math.floor(Math.LN2 * this.DB / Math.log(r));
}

// (public) 0 if this == 0, 1 if this > 0
function bnSigNum() {
    if (this.s < 0) return -1;else if (this.t <= 0 || this.t == 1 && this[0] <= 0) return 0;else return 1;
}

// (protected) convert to radix string
function bnpToRadix(b) {
    if (b == null) b = 10;
    if (this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b, cs);
    var d = nbv(a),
        y = nbi(),
        z = nbi(),
        r = "";
    this.divRemTo(d, y, z);
    while (y.signum() > 0) {
        r = (a + z.intValue()).toString(b).substr(1) + r;
        y.divRemTo(d, y, z);
    }
    return z.intValue().toString(b) + r;
}

// (protected) convert from radix string
function bnpFromRadix(s, b) {
    this.fromInt(0);
    if (b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b, cs),
        mi = false,
        j = 0,
        w = 0;
    for (var i = 0; i < s.length; ++i) {
        var x = intAt(s, i);
        if (x < 0) {
            if (s.charAt(i) == "-" && this.signum() == 0) mi = true;
            continue;
        }
        w = b * w + x;
        if (++j >= cs) {
            this.dMultiply(d);
            this.dAddOffset(w, 0);
            j = 0;
            w = 0;
        }
    }
    if (j > 0) {
        this.dMultiply(Math.pow(b, j));
        this.dAddOffset(w, 0);
    }
    if (mi) BigInteger.ZERO.subTo(this, this);
}

// (protected) alternate constructor
function bnpFromNumber(a, b, c) {
    if ("number" == typeof b) {
        // new BigInteger(int,int,RNG)
        if (a < 2) this.fromInt(1);else {
            this.fromNumber(a, c);
            if (!this.testBit(a - 1)) // force MSB set
                this.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, this);
            if (this.isEven()) this.dAddOffset(1, 0); // force odd
            while (!this.isProbablePrime(b)) {
                this.dAddOffset(2, 0);
                if (this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a - 1), this);
            }
        }
    } else {
        // new BigInteger(int,RNG)
        var x = new Array(),
            t = a & 7;
        x.length = (a >> 3) + 1;
        b.nextBytes(x);
        if (t > 0) x[0] &= (1 << t) - 1;else x[0] = 0;
        this.fromString(x, 256);
    }
}

// (public) convert to bigendian byte array
function bnToByteArray() {
    var i = this.t,
        r = new Array();
    r[0] = this.s;
    var p = this.DB - i * this.DB % 8,
        d,
        k = 0;
    if (i-- > 0) {
        if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p) r[k++] = d | this.s << this.DB - p;
        while (i >= 0) {
            if (p < 8) {
                d = (this[i] & (1 << p) - 1) << 8 - p;
                d |= this[--i] >> (p += this.DB - 8);
            } else {
                d = this[i] >> (p -= 8) & 0xff;
                if (p <= 0) {
                    p += this.DB;--i;
                }
            }
            if ((d & 0x80) != 0) d |= -256;
            if (k == 0 && (this.s & 0x80) != (d & 0x80)) ++k;
            if (k > 0 || d != this.s) r[k++] = d;
        }
    }
    return r;
}

function bnEquals(a) {
    return this.compareTo(a) == 0;
}
function bnMin(a) {
    return this.compareTo(a) < 0 ? this : a;
}
function bnMax(a) {
    return this.compareTo(a) > 0 ? this : a;
}

// (protected) r = this op a (bitwise)
function bnpBitwiseTo(a, op, r) {
    var i,
        f,
        m = Math.min(a.t, this.t);
    for (i = 0; i < m; ++i) {
        r[i] = op(this[i], a[i]);
    }if (a.t < this.t) {
        f = a.s & this.DM;
        for (i = m; i < this.t; ++i) {
            r[i] = op(this[i], f);
        }r.t = this.t;
    } else {
        f = this.s & this.DM;
        for (i = m; i < a.t; ++i) {
            r[i] = op(f, a[i]);
        }r.t = a.t;
    }
    r.s = op(this.s, a.s);
    r.clamp();
}

// (public) this & a
function op_and(x, y) {
    return x & y;
}
function bnAnd(a) {
    var r = nbi();this.bitwiseTo(a, op_and, r);return r;
}

// (public) this | a
function op_or(x, y) {
    return x | y;
}
function bnOr(a) {
    var r = nbi();this.bitwiseTo(a, op_or, r);return r;
}

// (public) this ^ a
function op_xor(x, y) {
    return x ^ y;
}
function bnXor(a) {
    var r = nbi();this.bitwiseTo(a, op_xor, r);return r;
}

// (public) this & ~a
function op_andnot(x, y) {
    return x & ~y;
}
function bnAndNot(a) {
    var r = nbi();this.bitwiseTo(a, op_andnot, r);return r;
}

// (public) ~this
function bnNot() {
    var r = nbi();
    for (var i = 0; i < this.t; ++i) {
        r[i] = this.DM & ~this[i];
    }r.t = this.t;
    r.s = ~this.s;
    return r;
}

// (public) this << n
function bnShiftLeft(n) {
    var r = nbi();
    if (n < 0) this.rShiftTo(-n, r);else this.lShiftTo(n, r);
    return r;
}

// (public) this >> n
function bnShiftRight(n) {
    var r = nbi();
    if (n < 0) this.lShiftTo(-n, r);else this.rShiftTo(n, r);
    return r;
}

// return index of lowest 1-bit in x, x < 2^31
function lbit(x) {
    if (x == 0) return -1;
    var r = 0;
    if ((x & 0xffff) == 0) {
        x >>= 16;r += 16;
    }
    if ((x & 0xff) == 0) {
        x >>= 8;r += 8;
    }
    if ((x & 0xf) == 0) {
        x >>= 4;r += 4;
    }
    if ((x & 3) == 0) {
        x >>= 2;r += 2;
    }
    if ((x & 1) == 0) ++r;
    return r;
}

// (public) returns index of lowest 1-bit (or -1 if none)
function bnGetLowestSetBit() {
    for (var i = 0; i < this.t; ++i) {
        if (this[i] != 0) return i * this.DB + lbit(this[i]);
    }if (this.s < 0) return this.t * this.DB;
    return -1;
}

// return number of 1 bits in x
function cbit(x) {
    var r = 0;
    while (x != 0) {
        x &= x - 1;++r;
    }
    return r;
}

// (public) return number of set bits
function bnBitCount() {
    var r = 0,
        x = this.s & this.DM;
    for (var i = 0; i < this.t; ++i) {
        r += cbit(this[i] ^ x);
    }return r;
}

// (public) true iff nth bit is set
function bnTestBit(n) {
    var j = Math.floor(n / this.DB);
    if (j >= this.t) return this.s != 0;
    return (this[j] & 1 << n % this.DB) != 0;
}

// (protected) this op (1<<n)
function bnpChangeBit(n, op) {
    var r = BigInteger.ONE.shiftLeft(n);
    this.bitwiseTo(r, op, r);
    return r;
}

// (public) this | (1<<n)
function bnSetBit(n) {
    return this.changeBit(n, op_or);
}

// (public) this & ~(1<<n)
function bnClearBit(n) {
    return this.changeBit(n, op_andnot);
}

// (public) this ^ (1<<n)
function bnFlipBit(n) {
    return this.changeBit(n, op_xor);
}

// (protected) r = this + a
function bnpAddTo(a, r) {
    var i = 0,
        c = 0,
        m = Math.min(a.t, this.t);
    while (i < m) {
        c += this[i] + a[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
    }
    if (a.t < this.t) {
        c += a.s;
        while (i < this.t) {
            c += this[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        c += this.s;
    } else {
        c += this.s;
        while (i < a.t) {
            c += a[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        c += a.s;
    }
    r.s = c < 0 ? -1 : 0;
    if (c > 0) r[i++] = c;else if (c < -1) r[i++] = this.DV + c;
    r.t = i;
    r.clamp();
}

// (public) this + a
function bnAdd(a) {
    var r = nbi();this.addTo(a, r);return r;
}

// (public) this - a
function bnSubtract(a) {
    var r = nbi();this.subTo(a, r);return r;
}

// (public) this * a
function bnMultiply(a) {
    var r = nbi();this.multiplyTo(a, r);return r;
}

// (public) this^2
function bnSquare() {
    var r = nbi();this.squareTo(r);return r;
}

// (public) this / a
function bnDivide(a) {
    var r = nbi();this.divRemTo(a, r, null);return r;
}

// (public) this % a
function bnRemainder(a) {
    var r = nbi();this.divRemTo(a, null, r);return r;
}

// (public) [this/a,this%a]
function bnDivideAndRemainder(a) {
    var q = nbi(),
        r = nbi();
    this.divRemTo(a, q, r);
    return new Array(q, r);
}

// (protected) this *= n, this >= 0, 1 < n < DV
function bnpDMultiply(n) {
    this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
    ++this.t;
    this.clamp();
}

// (protected) this += n << w words, this >= 0
function bnpDAddOffset(n, w) {
    if (n == 0) return;
    while (this.t <= w) {
        this[this.t++] = 0;
    }this[w] += n;
    while (this[w] >= this.DV) {
        this[w] -= this.DV;
        if (++w >= this.t) this[this.t++] = 0;
        ++this[w];
    }
}

// A "null" reducer
function NullExp() {}
function nNop(x) {
    return x;
}
function nMulTo(x, y, r) {
    x.multiplyTo(y, r);
}
function nSqrTo(x, r) {
    x.squareTo(r);
}

NullExp.prototype.convert = nNop;
NullExp.prototype.revert = nNop;
NullExp.prototype.mulTo = nMulTo;
NullExp.prototype.sqrTo = nSqrTo;

// (public) this^e
function bnPow(e) {
    return this.exp(e, new NullExp());
}

// (protected) r = lower n words of "this * a", a.t <= n
// "this" should be the larger one if appropriate.
function bnpMultiplyLowerTo(a, n, r) {
    var i = Math.min(this.t + a.t, n);
    r.s = 0; // assumes a,this >= 0
    r.t = i;
    while (i > 0) {
        r[--i] = 0;
    }var j;
    for (j = r.t - this.t; i < j; ++i) {
        r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
    }for (j = Math.min(a.t, n); i < j; ++i) {
        this.am(0, a[i], r, i, 0, n - i);
    }r.clamp();
}

// (protected) r = "this * a" without lower n words, n > 0
// "this" should be the larger one if appropriate.
function bnpMultiplyUpperTo(a, n, r) {
    --n;
    var i = r.t = this.t + a.t - n;
    r.s = 0; // assumes a,this >= 0
    while (--i >= 0) {
        r[i] = 0;
    }for (i = Math.max(n - this.t, 0); i < a.t; ++i) {
        r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
    }r.clamp();
    r.drShiftTo(1, r);
}

// Barrett modular reduction
function Barrett(m) {
    // setup Barrett
    this.r2 = nbi();
    this.q3 = nbi();
    BigInteger.ONE.dlShiftTo(2 * m.t, this.r2);
    this.mu = this.r2.divide(m);
    this.m = m;
}

function barrettConvert(x) {
    if (x.s < 0 || x.t > 2 * this.m.t) return x.mod(this.m);else if (x.compareTo(this.m) < 0) return x;else {
        var r = nbi();x.copyTo(r);this.reduce(r);return r;
    }
}

function barrettRevert(x) {
    return x;
}

// x = x mod m (HAC 14.42)
function barrettReduce(x) {
    x.drShiftTo(this.m.t - 1, this.r2);
    if (x.t > this.m.t + 1) {
        x.t = this.m.t + 1;x.clamp();
    }
    this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
    this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
    while (x.compareTo(this.r2) < 0) {
        x.dAddOffset(1, this.m.t + 1);
    }x.subTo(this.r2, x);
    while (x.compareTo(this.m) >= 0) {
        x.subTo(this.m, x);
    }
}

// r = x^2 mod m; x != r
function barrettSqrTo(x, r) {
    x.squareTo(r);this.reduce(r);
}

// r = x*y mod m; x,y != r
function barrettMulTo(x, y, r) {
    x.multiplyTo(y, r);this.reduce(r);
}

Barrett.prototype.convert = barrettConvert;
Barrett.prototype.revert = barrettRevert;
Barrett.prototype.reduce = barrettReduce;
Barrett.prototype.mulTo = barrettMulTo;
Barrett.prototype.sqrTo = barrettSqrTo;

// (public) this^e % m (HAC 14.85)
function bnModPow(e, m) {
    var i = e.bitLength(),
        k,
        r = nbv(1),
        z;
    if (i <= 0) return r;else if (i < 18) k = 1;else if (i < 48) k = 3;else if (i < 144) k = 4;else if (i < 768) k = 5;else k = 6;
    if (i < 8) z = new Classic(m);else if (m.isEven()) z = new Barrett(m);else z = new Montgomery(m);

    // precomputation
    var g = new Array(),
        n = 3,
        k1 = k - 1,
        km = (1 << k) - 1;
    g[1] = z.convert(this);
    if (k > 1) {
        var g2 = nbi();
        z.sqrTo(g[1], g2);
        while (n <= km) {
            g[n] = nbi();
            z.mulTo(g2, g[n - 2], g[n]);
            n += 2;
        }
    }

    var j = e.t - 1,
        w,
        is1 = true,
        r2 = nbi(),
        t;
    i = nbits(e[j]) - 1;
    while (j >= 0) {
        if (i >= k1) w = e[j] >> i - k1 & km;else {
            w = (e[j] & (1 << i + 1) - 1) << k1 - i;
            if (j > 0) w |= e[j - 1] >> this.DB + i - k1;
        }

        n = k;
        while ((w & 1) == 0) {
            w >>= 1;--n;
        }
        if ((i -= n) < 0) {
            i += this.DB;--j;
        }
        if (is1) {
            // ret == 1, don't bother squaring or multiplying it
            g[w].copyTo(r);
            is1 = false;
        } else {
            while (n > 1) {
                z.sqrTo(r, r2);z.sqrTo(r2, r);n -= 2;
            }
            if (n > 0) z.sqrTo(r, r2);else {
                t = r;r = r2;r2 = t;
            }
            z.mulTo(r2, g[w], r);
        }

        while (j >= 0 && (e[j] & 1 << i) == 0) {
            z.sqrTo(r, r2);t = r;r = r2;r2 = t;
            if (--i < 0) {
                i = this.DB - 1;--j;
            }
        }
    }
    return z.revert(r);
}

// (public) gcd(this,a) (HAC 14.54)
function bnGCD(a) {
    var x = this.s < 0 ? this.negate() : this.clone();
    var y = a.s < 0 ? a.negate() : a.clone();
    if (x.compareTo(y) < 0) {
        var t = x;x = y;y = t;
    }
    var i = x.getLowestSetBit(),
        g = y.getLowestSetBit();
    if (g < 0) return x;
    if (i < g) g = i;
    if (g > 0) {
        x.rShiftTo(g, x);
        y.rShiftTo(g, y);
    }
    while (x.signum() > 0) {
        if ((i = x.getLowestSetBit()) > 0) x.rShiftTo(i, x);
        if ((i = y.getLowestSetBit()) > 0) y.rShiftTo(i, y);
        if (x.compareTo(y) >= 0) {
            x.subTo(y, x);
            x.rShiftTo(1, x);
        } else {
            y.subTo(x, y);
            y.rShiftTo(1, y);
        }
    }
    if (g > 0) y.lShiftTo(g, y);
    return y;
}

// (protected) this % n, n < 2^26
function bnpModInt(n) {
    if (n <= 0) return 0;
    var d = this.DV % n,
        r = this.s < 0 ? n - 1 : 0;
    if (this.t > 0) if (d == 0) r = this[0] % n;else for (var i = this.t - 1; i >= 0; --i) {
        r = (d * r + this[i]) % n;
    }return r;
}

// (public) 1/this % m (HAC 14.61)
function bnModInverse(m) {
    var ac = m.isEven();
    if (this.isEven() && ac || m.signum() == 0) return BigInteger.ZERO;
    var u = m.clone(),
        v = this.clone();
    var a = nbv(1),
        b = nbv(0),
        c = nbv(0),
        d = nbv(1);
    while (u.signum() != 0) {
        while (u.isEven()) {
            u.rShiftTo(1, u);
            if (ac) {
                if (!a.isEven() || !b.isEven()) {
                    a.addTo(this, a);b.subTo(m, b);
                }
                a.rShiftTo(1, a);
            } else if (!b.isEven()) b.subTo(m, b);
            b.rShiftTo(1, b);
        }
        while (v.isEven()) {
            v.rShiftTo(1, v);
            if (ac) {
                if (!c.isEven() || !d.isEven()) {
                    c.addTo(this, c);d.subTo(m, d);
                }
                c.rShiftTo(1, c);
            } else if (!d.isEven()) d.subTo(m, d);
            d.rShiftTo(1, d);
        }
        if (u.compareTo(v) >= 0) {
            u.subTo(v, u);
            if (ac) a.subTo(c, a);
            b.subTo(d, b);
        } else {
            v.subTo(u, v);
            if (ac) c.subTo(a, c);
            d.subTo(b, d);
        }
    }
    if (v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
    if (d.compareTo(m) >= 0) return d.subtract(m);
    if (d.signum() < 0) d.addTo(m, d);else return d;
    if (d.signum() < 0) return d.add(m);else return d;
}

var lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
var lplim = (1 << 26) / lowprimes[lowprimes.length - 1];

// (public) test primality with certainty >= 1-.5^t
function bnIsProbablePrime(t) {
    var i,
        x = this.abs();
    if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1]) {
        for (i = 0; i < lowprimes.length; ++i) {
            if (x[0] == lowprimes[i]) return true;
        }return false;
    }
    if (x.isEven()) return false;
    i = 1;
    while (i < lowprimes.length) {
        var m = lowprimes[i],
            j = i + 1;
        while (j < lowprimes.length && m < lplim) {
            m *= lowprimes[j++];
        }m = x.modInt(m);
        while (i < j) {
            if (m % lowprimes[i++] == 0) return false;
        }
    }
    return x.millerRabin(t);
}

// (protected) true if probably prime (HAC 4.24, Miller-Rabin)
function bnpMillerRabin(t) {
    var n1 = this.subtract(BigInteger.ONE);
    var k = n1.getLowestSetBit();
    if (k <= 0) return false;
    var r = n1.shiftRight(k);
    t = t + 1 >> 1;
    if (t > lowprimes.length) t = lowprimes.length;
    var a = nbi();
    for (var i = 0; i < t; ++i) {
        //Pick bases at random, instead of starting at 2
        a.fromInt(lowprimes[Math.floor(Math.random() * lowprimes.length)]);
        var y = a.modPow(r, this);
        if (y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
            var j = 1;
            while (j++ < k && y.compareTo(n1) != 0) {
                y = y.modPowInt(2, this);
                if (y.compareTo(BigInteger.ONE) == 0) return false;
            }
            if (y.compareTo(n1) != 0) return false;
        }
    }
    return true;
}

// protected
BigInteger.prototype.chunkSize = bnpChunkSize;
BigInteger.prototype.toRadix = bnpToRadix;
BigInteger.prototype.fromRadix = bnpFromRadix;
BigInteger.prototype.fromNumber = bnpFromNumber;
BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
BigInteger.prototype.changeBit = bnpChangeBit;
BigInteger.prototype.addTo = bnpAddTo;
BigInteger.prototype.dMultiply = bnpDMultiply;
BigInteger.prototype.dAddOffset = bnpDAddOffset;
BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
BigInteger.prototype.modInt = bnpModInt;
BigInteger.prototype.millerRabin = bnpMillerRabin;

// public
BigInteger.prototype.clone = bnClone;
BigInteger.prototype.intValue = bnIntValue;
BigInteger.prototype.byteValue = bnByteValue;
BigInteger.prototype.shortValue = bnShortValue;
BigInteger.prototype.signum = bnSigNum;
BigInteger.prototype.toByteArray = bnToByteArray;
BigInteger.prototype.equals = bnEquals;
BigInteger.prototype.min = bnMin;
BigInteger.prototype.max = bnMax;
BigInteger.prototype.and = bnAnd;
BigInteger.prototype.or = bnOr;
BigInteger.prototype.xor = bnXor;
BigInteger.prototype.andNot = bnAndNot;
BigInteger.prototype.not = bnNot;
BigInteger.prototype.shiftLeft = bnShiftLeft;
BigInteger.prototype.shiftRight = bnShiftRight;
BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
BigInteger.prototype.bitCount = bnBitCount;
BigInteger.prototype.testBit = bnTestBit;
BigInteger.prototype.setBit = bnSetBit;
BigInteger.prototype.clearBit = bnClearBit;
BigInteger.prototype.flipBit = bnFlipBit;
BigInteger.prototype.add = bnAdd;
BigInteger.prototype.subtract = bnSubtract;
BigInteger.prototype.multiply = bnMultiply;
BigInteger.prototype.divide = bnDivide;
BigInteger.prototype.remainder = bnRemainder;
BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
BigInteger.prototype.modPow = bnModPow;
BigInteger.prototype.modInverse = bnModInverse;
BigInteger.prototype.pow = bnPow;
BigInteger.prototype.gcd = bnGCD;
BigInteger.prototype.isProbablePrime = bnIsProbablePrime;

// JSBN-specific extension
BigInteger.prototype.square = bnSquare;

// BigInteger interfaces not implemented in jsbn:

// BigInteger(int signum, byte[] magnitude)
// double doubleValue()
// float floatValue()
// int hashCode()
// long longValue()
// static BigInteger valueOf(long val)


//------------------------------ rsa.js -------------------------------------------
// Depends on jsbn.js and rng.js

// Version 1.1: support utf-8 encoding in pkcs1pad2

// convert a (hex) string to a bignum object
function parseBigInt(str, r) {
    return new BigInteger(str, r);
}

function linebrk(s, n) {
    var ret = "";
    var i = 0;
    while (i + n < s.length) {
        ret += s.substring(i, i + n) + "\n";
        i += n;
    }
    return ret + s.substring(i, s.length);
}

function byte2Hex(b) {
    if (b < 0x10) return "0" + b.toString(16);else return b.toString(16);
}

// PKCS#1 (type 2, random) pad input string s to n bytes, and return a bigint
function pkcs1pad2(s, n) {
    if (n < s.length + 11) {
        // TODO: fix for utf-8
        alert("Message too long for RSA");
        return null;
    }
    var ba = new Array();
    var i = s.length - 1;
    while (i >= 0 && n > 0) {
        var c = s.charCodeAt(i--);
        if (c < 128) {
            // encode using utf-8
            ba[--n] = c;
        } else if (c > 127 && c < 2048) {
            ba[--n] = c & 63 | 128;
            ba[--n] = c >> 6 | 192;
        } else {
            ba[--n] = c & 63 | 128;
            ba[--n] = c >> 6 & 63 | 128;
            ba[--n] = c >> 12 | 224;
        }
    }
    ba[--n] = 0;
    var rng = new SecureRandom();
    var x = new Array();
    while (n > 2) {
        // random non-zero pad
        x[0] = 0;
        while (x[0] == 0) {
            rng.nextBytes(x);
        }ba[--n] = x[0];
    }
    ba[--n] = 2;
    ba[--n] = 0;
    return new BigInteger(ba);
}

// "empty" RSA key constructor
function RSAKey() {
    this.n = null;
    this.e = 0;
    this.d = null;
    this.p = null;
    this.q = null;
    this.dmp1 = null;
    this.dmq1 = null;
    this.coeff = null;
}

// Set the public key fields N and e from hex strings
function RSASetPublic(N, E) {
    if (N != null && E != null && N.length > 0 && E.length > 0) {
        this.n = parseBigInt(N, 16);
        this.e = parseInt(E, 16);
    } else alert("Invalid RSA public key");
}

// Perform raw public operation on "x": return x^e (mod n)
function RSADoPublic(x) {
    return x.modPowInt(this.e, this.n);
}

// Return the PKCS#1 RSA encryption of "text" as an even-length hex string
function RSAEncrypt(text) {
    var m = pkcs1pad2(text, this.n.bitLength() + 7 >> 3);
    if (m == null) return null;
    var c = this.doPublic(m);
    if (c == null) return null;
    var h = c.toString(16);
    if ((h.length & 1) == 0) return h;else return "0" + h;
}

// Return the PKCS#1 RSA encryption of "text" as a Base64-encoded string
//function RSAEncryptB64(text) {
//  var h = this.encrypt(text);
//  if(h) return hex2b64(h); else return null;
//}

// protected
RSAKey.prototype.doPublic = RSADoPublic;

// public
RSAKey.prototype.setPublic = RSASetPublic;
RSAKey.prototype.encrypt = RSAEncrypt;
//RSAKey.prototype.encrypt_b64 = RSAEncryptB64;

//------------------------------ rsa2.js -------------------------------------------
// Depends on rsa.js and jsbn2.js

// Version 1.1: support utf-8 decoding in pkcs1unpad2

// Undo PKCS#1 (type 2, random) padding and, if valid, return the plaintext
function pkcs1unpad2(d, n) {
    var b = d.toByteArray();
    var i = 0;
    while (i < b.length && b[i] == 0) {
        ++i;
    }if (b.length - i != n - 1 || b[i] != 2) return null;
    ++i;
    while (b[i] != 0) {
        if (++i >= b.length) return null;
    }var ret = "";
    while (++i < b.length) {
        var c = b[i] & 255;
        if (c < 128) {
            // utf-8 decode
            ret += String.fromCharCode(c);
        } else if (c > 191 && c < 224) {
            ret += String.fromCharCode((c & 31) << 6 | b[i + 1] & 63);
            ++i;
        } else {
            ret += String.fromCharCode((c & 15) << 12 | (b[i + 1] & 63) << 6 | b[i + 2] & 63);
            i += 2;
        }
    }
    return ret;
}

function pkcs1unpad2_buffer(d, n) {
    var b = d.toByteArray();
    var i = 0;
    while (i < b.length && b[i] == 0) {
        ++i;
    }if (b.length - i != n - 1 || b[i] != 2) return null;
    ++i;
    while (b[i] != 0) {
        if (++i >= b.length) return null;
    }var ret = "";
    i++;
    var rt = new Uint8Array(b.length - i);
    var start = 0;
    while (i < b.length) {
        rt[start] = b[i] & 255;
        i++;
        start++;
    }
    return rt;
}

// Set the private key fields N, e, and d from hex strings
function RSASetPrivate(N, E, D) {
    if (N != null && E != null && N.length > 0 && E.length > 0) {
        this.n = parseBigInt(N, 16);
        this.e = parseInt(E, 16);
        this.d = parseBigInt(D, 16);
    } else alert("Invalid RSA private key");
}

// Set the private key fields N, e, d and CRT params from hex strings
function RSASetPrivateEx(N, E, D, P, Q, DP, DQ, C) {
    if (N != null && E != null && N.length > 0 && E.length > 0) {
        this.n = parseBigInt(N, 16);
        this.e = parseInt(E, 16);
        this.d = parseBigInt(D, 16);
        this.p = parseBigInt(P, 16);
        this.q = parseBigInt(Q, 16);
        this.dmp1 = parseBigInt(DP, 16);
        this.dmq1 = parseBigInt(DQ, 16);
        this.coeff = parseBigInt(C, 16);
    } else alert("Invalid RSA private key");
}

// Generate a new random private key B bits long, using public expt E
function RSAGenerate(B, E) {
    var rng = new SecureRandom();
    var qs = B >> 1;
    this.e = parseInt(E, 16);
    var ee = new BigInteger(E, 16);
    for (;;) {
        for (;;) {
            this.p = new BigInteger(B - qs, 1, rng);
            if (this.p.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0 && this.p.isProbablePrime(10)) break;
        }
        for (;;) {
            this.q = new BigInteger(qs, 1, rng);
            if (this.q.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0 && this.q.isProbablePrime(10)) break;
        }
        if (this.p.compareTo(this.q) <= 0) {
            var t = this.p;
            this.p = this.q;
            this.q = t;
        }
        var p1 = this.p.subtract(BigInteger.ONE);
        var q1 = this.q.subtract(BigInteger.ONE);
        var phi = p1.multiply(q1);
        if (phi.gcd(ee).compareTo(BigInteger.ONE) == 0) {
            this.n = this.p.multiply(this.q);
            this.d = ee.modInverse(phi);
            this.dmp1 = this.d.mod(p1);
            this.dmq1 = this.d.mod(q1);
            this.coeff = this.q.modInverse(this.p);
            break;
        }
    }
}

// Perform raw private operation on "x": return x^d (mod n)
function RSADoPrivate(x) {
    if (this.p == null || this.q == null) return x.modPow(this.d, this.n);

    // TODO: re-calculate any missing CRT params
    var xp = x.mod(this.p).modPow(this.dmp1, this.p);
    var xq = x.mod(this.q).modPow(this.dmq1, this.q);

    while (xp.compareTo(xq) < 0) {
        xp = xp.add(this.p);
    }return xp.subtract(xq).multiply(this.coeff).mod(this.p).multiply(this.q).add(xq);
}

// Return the PKCS#1 RSA decryption of "ctext".
// "ctext" is an even-length hex string and the output is a plain string.
function RSADecrypt(ctext) {
    var c = parseBigInt(ctext, 16);
    var m = this.doPrivate(c);
    if (m == null) return null;
    return pkcs1unpad2(m, this.n.bitLength() + 7 >> 3);
}

function RSADecryptBuffer(ctext) {
    var c = parseBigInt(ctext, 16);
    var m = this.doPrivate(c);
    if (m == null) return null;
    return pkcs1unpad2_buffer(m, this.n.bitLength() + 7 >> 3);
}

// Return the PKCS#1 RSA decryption of "ctext".
// "ctext" is a Base64-encoded string and the output is a plain string.
//function RSAB64Decrypt(ctext) {
//  var h = b64tohex(ctext);
//  if(h) return this.decrypt(h); else return null;
//}

// protected
RSAKey.prototype.doPrivate = RSADoPrivate;

// public
RSAKey.prototype.setPrivate = RSASetPrivate;
RSAKey.prototype.setPrivateEx = RSASetPrivateEx;
RSAKey.prototype.generate = RSAGenerate;
RSAKey.prototype.decrypt = RSADecrypt;
RSAKey.prototype.decryptBuffer = RSADecryptBuffer;
//RSAKey.prototype.b64_decrypt = RSAB64Decrypt;

module.exports = RSAKey;

/***/ }),

/***/ 0:
/*!************************!*\
  !*** multi ./index.js ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! ./index.js */"./index.js");


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4uL25vZGVfbW9kdWxlcy9hZXMtanMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4uL25vZGVfbW9kdWxlcy9hc2FwL2Jyb3dzZXItYXNhcC5qcyIsIndlYnBhY2s6Ly8vLi4vbm9kZV9tb2R1bGVzL2FzYXAvYnJvd3Nlci1yYXcuanMiLCJ3ZWJwYWNrOi8vLy4uL25vZGVfbW9kdWxlcy9wcm9taXNlL2luZGV4LmpzIiwid2VicGFjazovLy8uLi9ub2RlX21vZHVsZXMvcHJvbWlzZS9saWIvY29yZS5qcyIsIndlYnBhY2s6Ly8vLi4vbm9kZV9tb2R1bGVzL3Byb21pc2UvbGliL2RvbmUuanMiLCJ3ZWJwYWNrOi8vLy4uL25vZGVfbW9kdWxlcy9wcm9taXNlL2xpYi9lczYtZXh0ZW5zaW9ucy5qcyIsIndlYnBhY2s6Ly8vLi4vbm9kZV9tb2R1bGVzL3Byb21pc2UvbGliL2ZpbmFsbHkuanMiLCJ3ZWJwYWNrOi8vLy4uL25vZGVfbW9kdWxlcy9wcm9taXNlL2xpYi9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi4vbm9kZV9tb2R1bGVzL3Byb21pc2UvbGliL25vZGUtZXh0ZW5zaW9ucy5qcyIsIndlYnBhY2s6Ly8vLi4vbm9kZV9tb2R1bGVzL3Byb21pc2UvbGliL3N5bmNocm9ub3VzLmpzIiwid2VicGFjazovLy8uLi9ub2RlX21vZHVsZXMvd2VicGFjay9idWlsZGluL2dsb2JhbC5qcyIsIndlYnBhY2s6Ly8vLi4vbm9kZV9tb2R1bGVzL3doYXR3Zy1mZXRjaC9mZXRjaC5qcyIsIndlYnBhY2s6Ly8vLi9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9rZXlOdW1iZXJzLmpzIiwid2VicGFjazovLy8uL3JzYS5qcyJdLCJuYW1lcyI6WyJnZXRQYXJhbSIsInVybCIsImtleSIsIm9wdF9kZWZhdWx0IiwidW5kZWZpbmVkIiwicGFydHMiLCJzcGxpdCIsImxlbmd0aCIsInZhbHVlIiwiUmVnRXhwIiwiZXhlYyIsImRlY29kZVVSSUNvbXBvbmVudCIsInRvU3RyaW5nIiwicmVwbGFjZSIsInN0b3JhZ2VLZXkiLCJzY3JpcHRLZXkiLCJjdXJyZW50S2V5IiwiY3VycmVudEVudHJ5cHRlZEtleSIsImN1cnJlbnRDb3VudGVyIiwiY3VycmVudFNlcXVlbmNlIiwiYmFzZVVybCIsIndpbmRvdyIsImF2bmF2Iiwic2NyaXB0IiwiZG9jdW1lbnQiLCJjdXJyZW50U2NyaXB0IiwiZ2V0QXR0cmlidXRlIiwic2siLCJjdXJyZW50U2Vzc2lvbklkIiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsImRlY3J5cHQiLCJSU0FLZXkiLCJzZXRQcml2YXRlRXgiLCJwcml2YXRlTnVtYmVycyIsIk4iLCJFIiwiRCIsIlAiLCJRIiwiRFAiLCJEUSIsIkMiLCJydCIsImRlY3J5cHRCdWZmZXIiLCJlbmNyeXB0IiwiYWVzQ3RyIiwiQWVzanMiLCJNb2RlT2ZPcGVyYXRpb24iLCJjdHIiLCJlbmNyeXB0ZWRCeXRlcyIsInV0aWxzIiwidXRmOCIsInRvQnl0ZXMiLCJoZXgiLCJmcm9tQnl0ZXMiLCJlIiwiY29uc29sZSIsImxvZyIsImdldEJhc2VVcmwiLCJlbCIsImdldEVsZW1lbnRCeUlkIiwiZmV0Y2hLZXkiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImVuY29kZVVSSUNvbXBvbmVudCIsIm9wdGlvbnMiLCJoZWFkZXJzIiwiZmV0Y2giLCJ0aGVuIiwicmVzcG9uc2UiLCJzdGF0dXMiLCJzdGF0dXNUZXh0Iiwib2siLCJqc29uIiwiZGF0YSIsImNhdGNoIiwiZXJyb3IiLCJoZWFydEJlYXQiLCJqc29uRGF0YSIsInNlcXVlbmNlIiwic2Vzc2lvbklkIiwic2V0SXRlbSIsIkNvdW50ZXIiLCJEYXRlIiwiZ2V0VGltZSIsImVuY3J5cHRVcmwiLCJ1cmxQYXJ0IiwiX2NvdW50ZXIiLCJtb2R1bGUiLCJleHBvcnRzIiwiZGJpdHMiLCJjYW5hcnkiLCJqX2xtIiwiQmlnSW50ZWdlciIsImEiLCJiIiwiYyIsImZyb21OdW1iZXIiLCJmcm9tU3RyaW5nIiwibmJpIiwiYW0xIiwiaSIsIngiLCJ3IiwiaiIsIm4iLCJ2IiwiTWF0aCIsImZsb29yIiwiYW0yIiwieGwiLCJ4aCIsImwiLCJoIiwibSIsImFtMyIsIm5hdmlnYXRvciIsImFwcE5hbWUiLCJwcm90b3R5cGUiLCJhbSIsIkRCIiwiRE0iLCJEViIsIkJJX0ZQIiwiRlYiLCJwb3ciLCJGMSIsIkYyIiwiQklfUk0iLCJCSV9SQyIsIkFycmF5IiwicnIiLCJ2diIsImNoYXJDb2RlQXQiLCJpbnQyY2hhciIsImNoYXJBdCIsImludEF0IiwicyIsImJucENvcHlUbyIsInIiLCJ0IiwiYm5wRnJvbUludCIsIm5idiIsImZyb21JbnQiLCJibnBGcm9tU3RyaW5nIiwiayIsImZyb21SYWRpeCIsIm1pIiwic2giLCJjbGFtcCIsIlpFUk8iLCJzdWJUbyIsImJucENsYW1wIiwiYm5Ub1N0cmluZyIsIm5lZ2F0ZSIsInRvUmFkaXgiLCJrbSIsImQiLCJwIiwiYm5OZWdhdGUiLCJibkFicyIsImJuQ29tcGFyZVRvIiwibmJpdHMiLCJibkJpdExlbmd0aCIsImJucERMU2hpZnRUbyIsImJucERSU2hpZnRUbyIsIm1heCIsImJucExTaGlmdFRvIiwiYnMiLCJjYnMiLCJibSIsImRzIiwiYm5wUlNoaWZ0VG8iLCJibnBTdWJUbyIsIm1pbiIsImJucE11bHRpcGx5VG8iLCJhYnMiLCJ5IiwiYm5wU3F1YXJlVG8iLCJibnBEaXZSZW1UbyIsInEiLCJwbSIsInB0IiwiY29weVRvIiwidHMiLCJtcyIsIm5zaCIsImxTaGlmdFRvIiwieXMiLCJ5MCIsInl0IiwiZDEiLCJkMiIsImRsU2hpZnRUbyIsImNvbXBhcmVUbyIsIk9ORSIsInFkIiwiZHJTaGlmdFRvIiwiclNoaWZ0VG8iLCJibk1vZCIsImRpdlJlbVRvIiwiQ2xhc3NpYyIsImNDb252ZXJ0IiwibW9kIiwiY1JldmVydCIsImNSZWR1Y2UiLCJjTXVsVG8iLCJtdWx0aXBseVRvIiwicmVkdWNlIiwiY1NxclRvIiwic3F1YXJlVG8iLCJjb252ZXJ0IiwicmV2ZXJ0IiwibXVsVG8iLCJzcXJUbyIsImJucEludkRpZ2l0IiwiTW9udGdvbWVyeSIsIm1wIiwiaW52RGlnaXQiLCJtcGwiLCJtcGgiLCJ1bSIsIm10MiIsIm1vbnRDb252ZXJ0IiwibW9udFJldmVydCIsIm1vbnRSZWR1Y2UiLCJ1MCIsIm1vbnRTcXJUbyIsIm1vbnRNdWxUbyIsImJucElzRXZlbiIsImJucEV4cCIsInoiLCJyMiIsImciLCJibk1vZFBvd0ludCIsImlzRXZlbiIsImV4cCIsImJpdExlbmd0aCIsIm1vZFBvd0ludCIsImJuQ2xvbmUiLCJibkludFZhbHVlIiwiYm5CeXRlVmFsdWUiLCJiblNob3J0VmFsdWUiLCJibnBDaHVua1NpemUiLCJMTjIiLCJiblNpZ051bSIsImJucFRvUmFkaXgiLCJzaWdudW0iLCJjcyIsImNodW5rU2l6ZSIsImludFZhbHVlIiwic3Vic3RyIiwiYm5wRnJvbVJhZGl4IiwiZE11bHRpcGx5IiwiZEFkZE9mZnNldCIsImJucEZyb21OdW1iZXIiLCJ0ZXN0Qml0IiwiYml0d2lzZVRvIiwic2hpZnRMZWZ0Iiwib3Bfb3IiLCJpc1Byb2JhYmxlUHJpbWUiLCJuZXh0Qnl0ZXMiLCJiblRvQnl0ZUFycmF5IiwiYm5FcXVhbHMiLCJibk1pbiIsImJuTWF4IiwiYm5wQml0d2lzZVRvIiwib3AiLCJmIiwib3BfYW5kIiwiYm5BbmQiLCJibk9yIiwib3BfeG9yIiwiYm5Yb3IiLCJvcF9hbmRub3QiLCJibkFuZE5vdCIsImJuTm90IiwiYm5TaGlmdExlZnQiLCJiblNoaWZ0UmlnaHQiLCJsYml0IiwiYm5HZXRMb3dlc3RTZXRCaXQiLCJjYml0IiwiYm5CaXRDb3VudCIsImJuVGVzdEJpdCIsImJucENoYW5nZUJpdCIsImJuU2V0Qml0IiwiY2hhbmdlQml0IiwiYm5DbGVhckJpdCIsImJuRmxpcEJpdCIsImJucEFkZFRvIiwiYm5BZGQiLCJhZGRUbyIsImJuU3VidHJhY3QiLCJibk11bHRpcGx5IiwiYm5TcXVhcmUiLCJibkRpdmlkZSIsImJuUmVtYWluZGVyIiwiYm5EaXZpZGVBbmRSZW1haW5kZXIiLCJibnBETXVsdGlwbHkiLCJibnBEQWRkT2Zmc2V0IiwiTnVsbEV4cCIsIm5Ob3AiLCJuTXVsVG8iLCJuU3FyVG8iLCJiblBvdyIsImJucE11bHRpcGx5TG93ZXJUbyIsImJucE11bHRpcGx5VXBwZXJUbyIsIkJhcnJldHQiLCJxMyIsIm11IiwiZGl2aWRlIiwiYmFycmV0dENvbnZlcnQiLCJiYXJyZXR0UmV2ZXJ0IiwiYmFycmV0dFJlZHVjZSIsIm11bHRpcGx5VXBwZXJUbyIsIm11bHRpcGx5TG93ZXJUbyIsImJhcnJldHRTcXJUbyIsImJhcnJldHRNdWxUbyIsImJuTW9kUG93IiwiazEiLCJnMiIsImlzMSIsImJuR0NEIiwiY2xvbmUiLCJnZXRMb3dlc3RTZXRCaXQiLCJibnBNb2RJbnQiLCJibk1vZEludmVyc2UiLCJhYyIsInUiLCJzdWJ0cmFjdCIsImFkZCIsImxvd3ByaW1lcyIsImxwbGltIiwiYm5Jc1Byb2JhYmxlUHJpbWUiLCJtb2RJbnQiLCJtaWxsZXJSYWJpbiIsImJucE1pbGxlclJhYmluIiwibjEiLCJzaGlmdFJpZ2h0IiwicmFuZG9tIiwibW9kUG93IiwiYnl0ZVZhbHVlIiwic2hvcnRWYWx1ZSIsInRvQnl0ZUFycmF5IiwiZXF1YWxzIiwiYW5kIiwib3IiLCJ4b3IiLCJhbmROb3QiLCJub3QiLCJiaXRDb3VudCIsInNldEJpdCIsImNsZWFyQml0IiwiZmxpcEJpdCIsIm11bHRpcGx5IiwicmVtYWluZGVyIiwiZGl2aWRlQW5kUmVtYWluZGVyIiwibW9kSW52ZXJzZSIsImdjZCIsInNxdWFyZSIsInBhcnNlQmlnSW50Iiwic3RyIiwibGluZWJyayIsInJldCIsInN1YnN0cmluZyIsImJ5dGUySGV4IiwicGtjczFwYWQyIiwiYWxlcnQiLCJiYSIsInJuZyIsIlNlY3VyZVJhbmRvbSIsImRtcDEiLCJkbXExIiwiY29lZmYiLCJSU0FTZXRQdWJsaWMiLCJwYXJzZUludCIsIlJTQURvUHVibGljIiwiUlNBRW5jcnlwdCIsInRleHQiLCJkb1B1YmxpYyIsInNldFB1YmxpYyIsInBrY3MxdW5wYWQyIiwiU3RyaW5nIiwiZnJvbUNoYXJDb2RlIiwicGtjczF1bnBhZDJfYnVmZmVyIiwiVWludDhBcnJheSIsInN0YXJ0IiwiUlNBU2V0UHJpdmF0ZSIsIlJTQVNldFByaXZhdGVFeCIsIlJTQUdlbmVyYXRlIiwiQiIsInFzIiwiZWUiLCJwMSIsInExIiwicGhpIiwiUlNBRG9Qcml2YXRlIiwieHAiLCJ4cSIsIlJTQURlY3J5cHQiLCJjdGV4dCIsImRvUHJpdmF0ZSIsIlJTQURlY3J5cHRCdWZmZXIiLCJzZXRQcml2YXRlIiwiZ2VuZXJhdGUiXSwibWFwcGluZ3MiOiI7UUFBQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTs7O1FBR0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDBDQUEwQyxnQ0FBZ0M7UUFDMUU7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSx3REFBd0Qsa0JBQWtCO1FBQzFFO1FBQ0EsaURBQWlELGNBQWM7UUFDL0Q7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBLHlDQUF5QyxpQ0FBaUM7UUFDMUUsZ0hBQWdILG1CQUFtQixFQUFFO1FBQ3JJO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMkJBQTJCLDBCQUEwQixFQUFFO1FBQ3ZELGlDQUFpQyxlQUFlO1FBQ2hEO1FBQ0E7UUFDQTs7UUFFQTtRQUNBLHNEQUFzRCwrREFBK0Q7O1FBRXJIO1FBQ0E7OztRQUdBO1FBQ0E7Ozs7Ozs7Ozs7OztBQ2xGQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EseUNBQXlDLGNBQWM7O0FBRXZELHVCQUF1QixxQkFBcUI7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFF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QUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTOztBQUVUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBLFFBQVEsSUFBOEI7QUFDdEM7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsS0FBSyxNQUFNLEVBWU47OztBQUdMLENBQUM7Ozs7Ozs7Ozs7Ozs7QUNseUJZOztBQUViO0FBQ0EsY0FBYyxtQkFBTyxDQUFDLGtEQUFPO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLE1BQU07QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7QUNqRUEsOENBQWE7O0FBRWI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0VBQWdFLGtCQUFrQjtBQUNsRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNEJBQTRCLG9CQUFvQjtBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FDOU5hOztBQUViLGlCQUFpQixtQkFBTyxDQUFDLG1EQUFPOzs7Ozs7Ozs7Ozs7O0FDRm5COztBQUViLFdBQVcsbUJBQU8sQ0FBQyxxREFBVTs7QUFFN0I7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxxREFBcUQsY0FBYztBQUNuRTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLG9CQUFvQjtBQUN2QztBQUNBO0FB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O0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRU87QUFDUDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsR0FBRztBQUNIO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsR0FBRztBQUNIO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLGlCQUFpQixpQkFBaUI7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLEtBQUs7QUFDTDtBQUNBLEtBQUs7QUFDTDtBQUNBLEtBQUs7QUFDTDtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0EscURBQXFEO0FBQ3JELE9BQU87QUFDUDtBQUNBLE9BQU87QUFDUCw0RUFBNEU7QUFDNUU7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0EsT0FBTztBQUNQO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0EsS0FBSztBQUNMO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRU87QUFDUDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsNEJBQTRCLHFCQUFxQjtBQUNqRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FB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LEdBQXhKLEVBQTRKLEdBQTVKLEVBQWdLLEdBQWhLLEVBQW9LLEdBQXBLLEVBQXdLLEdBQXhLLEVBQTRLLEdBQTVLLEVBQWdMLEdBQWhMLEVBQW9MLEdBQXBMLEVBQXdMLEdBQXhMLEVBQTRMLEdBQTVMLEVBQWdNLEdBQWhNLEVBQW9NLEdBQXBNLEVBQXdNLEdBQXhNLEVBQTRNLEdBQTVNLEVBQWdOLEdBQWhOLEVBQW9OLEdBQXBOLEVBQXdOLEdBQXhOLEVBQTROLEdBQTVOLEVBQWdPLEdBQWhPLEVBQW9PLEdBQXBPLEVBQXdPLEdBQXhPLEVBQTRPLEdBQTVPLEVBQWdQLEdBQWhQLEVBQW9QLEdBQXBQLEVBQXdQLEdBQXhQLEVBQTRQLEdBQTVQLEVBQWdRLEdBQWhRLEVBQW9RLEdBQXBRLEVBQXdRLEdBQXhRLEVBQTRRLEdBQTVRLEVBQWdSLEdBQWhSLEVBQW9SLEdBQXBSLEVBQXdSLEdBQXhSLEVBQTRSLEdBQTVSLEVBQWdTLEdBQWhTLEVBQW9TLEdBQXBTLEVBQXdTLEdBQXhTLEVBQTRTLEdBQTVTLEVBQWdULEdBQWhULEVBQW9ULEdBQXBULEVBQXdULEdBQXhULEVBQTRULEdBQTVULEVBQWdVLEdBQWhVLEVBQW9VLEdBQXBVLEVBQXdVLEdBQXhVLEVBQTRVLEdBQTVVLEVBQWdWLEdBQWhWLEVBQW9WLEdBQXBWLEVBQXdWLEdBQXhWLEVBQTRWLEdBQTVWLEVBQWdXLEdBQWhXLEVBQW9XLEdBQXBXLEVBQXdXLEdBQXhXLEVBQTRXLEdBQTVXLEVBQWdYLEdBQWhYLEVBQW9YLEdBQXBYLEVBQXdYLEdBQXhYLEVBQTRYLEdBQTVYLEVBQWdZLEdBQWhZLEVBQW9ZLEdBQXBZLEVBQXdZLEdBQXhZLEVBQTRZLEdBQTVZLEVBQWdaLEdBQWhaLEVBQW9aLEdBQXBaLEVBQXdaLEdBQXhaLEVBQTRaLEdBQTVaLEVBQWdhLEdBQWhhLEVBQW9hLEdBQXBhLEVBQXdhLEdBQXhhLEVBQTRhLEdBQTVhLEVBQWdiLEdBQWhiLEVBQW9iLEdBQXBiLEVBQXdiLEdBQXhiLEVBQTRiLEdBQTViLEVBQWdjLEdBQWhjLEVBQW9j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anMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gMCk7XG4iLCIvKiEgTUlUIExpY2Vuc2UuIENvcHlyaWdodCAyMDE1LTIwMTggUmljaGFyZCBNb29yZSA8bWVAcmljbW9vLmNvbT4uIFNlZSBMSUNFTlNFLnR4dC4gKi9cbihmdW5jdGlvbihyb290KSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICBmdW5jdGlvbiBjaGVja0ludCh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gKHBhcnNlSW50KHZhbHVlKSA9PT0gdmFsdWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrSW50cyhhcnJheWlzaCkge1xuICAgICAgICBpZiAoIWNoZWNrSW50KGFycmF5aXNoLmxlbmd0aCkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheWlzaC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKCFjaGVja0ludChhcnJheWlzaFtpXSkgfHwgYXJyYXlpc2hbaV0gPCAwIHx8IGFycmF5aXNoW2ldID4gMjU1KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29lcmNlQXJyYXkoYXJnLCBjb3B5KSB7XG5cbiAgICAgICAgLy8gQXJyYXlCdWZmZXIgdmlld1xuICAgICAgICBpZiAoYXJnLmJ1ZmZlciAmJiBhcmcubmFtZSA9PT0gJ1VpbnQ4QXJyYXknKSB7XG5cbiAgICAgICAgICAgIGlmIChjb3B5KSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZy5zbGljZSkge1xuICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcuc2xpY2UoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhcmcgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGFyZztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEl0J3MgYW4gYXJyYXk7IGNoZWNrIGl0IGlzIGEgdmFsaWQgcmVwcmVzZW50YXRpb24gb2YgYSBieXRlXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcbiAgICAgICAgICAgIGlmICghY2hlY2tJbnRzKGFyZykpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FycmF5IGNvbnRhaW5zIGludmFsaWQgdmFsdWU6ICcgKyBhcmcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYXJnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNvbWV0aGluZyBlbHNlLCBidXQgYmVoYXZlcyBsaWtlIGFuIGFycmF5IChtYXliZSBhIEJ1ZmZlcj8gQXJndW1lbnRzPylcbiAgICAgICAgaWYgKGNoZWNrSW50KGFyZy5sZW5ndGgpICYmIGNoZWNrSW50cyhhcmcpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYXJnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcigndW5zdXBwb3J0ZWQgYXJyYXktbGlrZSBvYmplY3QnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVBcnJheShsZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGxlbmd0aCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29weUFycmF5KHNvdXJjZUFycmF5LCB0YXJnZXRBcnJheSwgdGFyZ2V0U3RhcnQsIHNvdXJjZVN0YXJ0LCBzb3VyY2VFbmQpIHtcbiAgICAgICAgaWYgKHNvdXJjZVN0YXJ0ICE9IG51bGwgfHwgc291cmNlRW5kICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChzb3VyY2VBcnJheS5zbGljZSkge1xuICAgICAgICAgICAgICAgIHNvdXJjZUFycmF5ID0gc291cmNlQXJyYXkuc2xpY2Uoc291cmNlU3RhcnQsIHNvdXJjZUVuZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNvdXJjZUFycmF5ID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoc291cmNlQXJyYXksIHNvdXJjZVN0YXJ0LCBzb3VyY2VFbmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRhcmdldEFycmF5LnNldChzb3VyY2VBcnJheSwgdGFyZ2V0U3RhcnQpO1xuICAgIH1cblxuXG5cbiAgICB2YXIgY29udmVydFV0ZjggPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIGZ1bmN0aW9uIHRvQnl0ZXModGV4dCkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdLCBpID0gMDtcbiAgICAgICAgICAgIHRleHQgPSBlbmNvZGVVUkkodGV4dCk7XG4gICAgICAgICAgICB3aGlsZSAoaSA8IHRleHQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGMgPSB0ZXh0LmNoYXJDb2RlQXQoaSsrKTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGl0IGlzIGEgJSBzaWduLCBlbmNvZGUgdGhlIGZvbGxvd2luZyAyIGJ5dGVzIGFzIGEgaGV4IHZhbHVlXG4gICAgICAgICAgICAgICAgaWYgKGMgPT09IDM3KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcnNlSW50KHRleHQuc3Vic3RyKGksIDIpLCAxNikpXG4gICAgICAgICAgICAgICAgICAgIGkgKz0gMjtcblxuICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSwganVzdCB0aGUgYWN0dWFsIGJ5dGVcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNvZXJjZUFycmF5KHJlc3VsdCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBmcm9tQnl0ZXMoYnl0ZXMpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXSwgaSA9IDA7XG5cbiAgICAgICAgICAgIHdoaWxlIChpIDwgYnl0ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGMgPSBieXRlc1tpXTtcblxuICAgICAgICAgICAgICAgIGlmIChjIDwgMTI4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUoYykpO1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjID4gMTkxICYmIGMgPCAyMjQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZSgoKGMgJiAweDFmKSA8PCA2KSB8IChieXRlc1tpICsgMV0gJiAweDNmKSkpO1xuICAgICAgICAgICAgICAgICAgICBpICs9IDI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZSgoKGMgJiAweDBmKSA8PCAxMikgfCAoKGJ5dGVzW2kgKyAxXSAmIDB4M2YpIDw8IDYpIHwgKGJ5dGVzW2kgKyAyXSAmIDB4M2YpKSk7XG4gICAgICAgICAgICAgICAgICAgIGkgKz0gMztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQuam9pbignJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdG9CeXRlczogdG9CeXRlcyxcbiAgICAgICAgICAgIGZyb21CeXRlczogZnJvbUJ5dGVzLFxuICAgICAgICB9XG4gICAgfSkoKTtcblxuICAgIHZhciBjb252ZXJ0SGV4ID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICBmdW5jdGlvbiB0b0J5dGVzKHRleHQpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGV4dC5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcnNlSW50KHRleHQuc3Vic3RyKGksIDIpLCAxNikpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaHR0cDovL2l4dGkubmV0L2RldmVsb3BtZW50L2phdmFzY3JpcHQvMjAxMS8xMS8xMS9iYXNlNjQtZW5jb2RlZGVjb2RlLW9mLXV0ZjgtaW4tYnJvd3Nlci13aXRoLWpzLmh0bWxcbiAgICAgICAgdmFyIEhleCA9ICcwMTIzNDU2Nzg5YWJjZGVmJztcblxuICAgICAgICBmdW5jdGlvbiBmcm9tQnl0ZXMoYnl0ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdiA9IGJ5dGVzW2ldO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChIZXhbKHYgJiAweGYwKSA+PiA0XSArIEhleFt2ICYgMHgwZl0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LmpvaW4oJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRvQnl0ZXM6IHRvQnl0ZXMsXG4gICAgICAgICAgICBmcm9tQnl0ZXM6IGZyb21CeXRlcyxcbiAgICAgICAgfVxuICAgIH0pKCk7XG5cblxuICAgIC8vIE51bWJlciBvZiByb3VuZHMgYnkga2V5c2l6ZVxuICAgIHZhciBudW1iZXJPZlJvdW5kcyA9IHsxNjogMTAsIDI0OiAxMiwgMzI6IDE0fVxuXG4gICAgLy8gUm91bmQgY29uc3RhbnQgd29yZHNcbiAgICB2YXIgcmNvbiA9IFsweDAxLCAweDAyLCAweDA0LCAweDA4LCAweDEwLCAweDIwLCAweDQwLCAweDgwLCAweDFiLCAweDM2LCAweDZjLCAweGQ4LCAweGFiLCAweDRkLCAweDlhLCAweDJmLCAweDVlLCAweGJjLCAweDYzLCAweGM2LCAweDk3LCAweDM1LCAweDZhLCAweGQ0LCAweGIzLCAweDdkLCAweGZhLCAweGVmLCAweGM1LCAweDkxXTtcblxuICAgIC8vIFMtYm94IGFuZCBJbnZlcnNlIFMtYm94IChTIGlzIGZvciBTdWJzdGl0dXRpb24pXG4gICAgdmFyIFMgPSBbMHg2MywgMHg3YywgMHg3NywgMHg3YiwgMHhmMiwgMHg2YiwgMHg2ZiwgMHhjNSwgMHgzMCwgMHgwMSwgMHg2NywgMHgyYiwgMHhmZSwgMHhkNywgMHhhYiwgMHg3NiwgMHhjYSwgMHg4MiwgMHhjOSwgMHg3ZCwgMHhmYSwgMHg1OSwgMHg0NywgMHhmMCwgMHhhZCwgMHhkNCwgMHhhMiwgMHhhZiwgMHg5YywgMHhhNCwgMHg3MiwgMHhjMCwgMHhiNywgMHhmZCwgMHg5MywgMHgyNiwgMHgzNiwgMHgzZiwgMHhmNywgMHhjYywgMHgzNCwgMHhhNSwgMHhlNSwgMHhmMSwgMHg3MSwgMHhkOCwgMHgzMSwgMHgxNSwgMHgwNCwgMHhjNywgMHgyMywgMHhjMywgMHgxOCwgMHg5NiwgMHgwNSwgMHg5YSwgMHgwNywgMHgxMiwgMHg4MCwgMHhlMiwgMHhlYiwgMHgyNywgMHhiMiwgMHg3NSwgMHgwOSwgMHg4MywgMHgyYywgMHgxYSwgMHgxYiwgMHg2ZSwgMHg1YSwgMHhhMCwgMHg1MiwgMHgzYiwgMHhkNiwgMHhiMywgMHgyOSwgMHhlMywgMHgyZiwgMHg4NCwgMHg1MywgMHhkMSwgMHgwMCwgMHhlZCwgMHgyMCwgMHhmYywgMHhiMSwgMHg1YiwgMHg2YSwgMHhjYiwgMHhiZSwgMHgzOSwgMHg0YSwgMHg0YywgMHg1OCwgMHhjZiwgMHhkMCwgMHhlZiwgMHhhYSwgMHhmYiwgMHg0MywgMHg0ZCwgMHgzMywgMHg4NSwgMHg0NSwgMHhmOSwgMHgwMiwgMHg3ZiwgMHg1MCwgMHgzYywgMHg5ZiwgMHhhOCwgMHg1MSwgMHhhMywgMHg0MCwgMHg4ZiwgMHg5MiwgMHg5ZCwgMHgzOCwgMHhmNSwgMHhiYywgMHhiNiwgMHhkYSwgMHgyMSwgMHgxMCwgMHhmZiwgMHhmMywgMHhkMiwgMHhjZCwgMHgwYywgMHgxMywgMHhlYywgMHg1ZiwgMHg5NywgMHg0NCwgMHgxNywgMHhjNCwgMHhhNywgMHg3ZSwgMHgzZCwgMHg2NCwgMHg1ZCwgMHgxOSwgMHg3MywgMHg2MCwgMHg4MSwgMHg0ZiwgMHhkYywgMHgyMiwgMHgyYSwgMHg5MCwgMHg4OCwgMHg0NiwgMHhlZSwgMHhiOCwgMHgxNCwgMHhkZSwgMHg1ZSwgMHgwYiwgMHhkYiwgMHhlMCwgMHgzMiwgMHgzYSwgMHgwYSwgMHg0OSwgMHgwNiwgMHgyNCwgMHg1YywgMHhjMiwgMHhkMywgMHhhYywgMHg2MiwgMHg5MSwgMHg5NSwgMHhlNCwgMHg3OSwgMHhlNywgMHhjOCwgMHgzNywgMHg2ZCwgMHg4ZCwgMHhkNSwgMHg0ZSwgMHhhOSwgMHg2YywgMHg1NiwgMHhmNCwgMHhlYSwgMHg2NSwgMHg3YSwgMHhhZSwgMHgwOCwgMHhiYSwgMHg3OCwgMHgyNSwgMHgyZSwgMHgxYywgMHhhNiwgMHhiNCwgMHhjNiwgMHhlOCwgMHhkZCwgMHg3NCwgMHgxZiwgMHg0YiwgMHhiZCwgMHg4YiwgMHg4YSwgMHg3MCwgMHgzZSwgMHhiNSwgMHg2NiwgMHg0OCwgMHgwMywgMHhmNiwgMHgwZSwgMHg2MSwgMHgzNSwgMHg1NywgMHhiOSwgMHg4NiwgMHhjMSwgMHgxZCwgMHg5ZSwgMHhlMSwgMHhmOCwgMHg5OCwgMHgxMSwgMHg2OSwgMHhkOSwgMHg4ZSwgMHg5NCwgMHg5YiwgMHgxZSwgMHg4NywgMHhlOSwgMHhjZSwgMHg1NSwgMHgyOCwgMHhkZiwgMHg4YywgMHhhMSwgMHg4OSwgMHgwZCwgMHhiZiwgMHhlNiwgMHg0MiwgMHg2OCwgMHg0MSwgMHg5OSwgMHgyZCwgMHgwZiwgMHhiMCwgMHg1NCwgMHhiYiwgMHgxNl07XG4gICAgdmFyIFNpID1bMHg1MiwgMHgwOSwgMHg2YSwgMHhkNSwgMHgzMCwgMHgzNiwgMHhhNSwgMHgzOCwgMHhiZiwgMHg0MCwgMHhhMywgMHg5ZSwgMHg4MSwgMHhmMywgMHhkNywgMHhmYiwgMHg3YywgMHhlMywgMHgzOSwgMHg4MiwgMHg5YiwgMHgyZiwgMHhmZiwgMHg4NywgMHgzNCwgMHg4ZSwgMHg0MywgMHg0NCwgMHhjNCwgMHhkZSwgMHhlOSwgMHhjYiwgMHg1NCwgMHg3YiwgMHg5NCwgMHgzMiwgMHhhNiwgMHhjMiwgMHgyMywgMHgzZCwgMHhlZSwgMHg0YywgMHg5NSwgMHgwYiwgMHg0MiwgMHhmYSwgMHhjMywgMHg0ZSwgMHgwOCwgMHgyZSwgMHhhMSwgMHg2NiwgMHgyOCwgMHhkOSwgMHgyNCwgMHhiMiwgMHg3NiwgMHg1YiwgMHhhMiwgMHg0OSwgMHg2ZCwgMHg4YiwgMHhkMSwgMHgyNSwgMHg3MiwgMHhmOCwgMHhmNiwgMHg2NCwgMHg4NiwgMHg2OCwgMHg5OCwgMHgxNiwgMHhkNCwgMHhhNCwgMHg1YywgMHhjYywgMHg1ZCwgMHg2NSwgMHhiNiwgMHg5MiwgMHg2YywgMHg3MCwgMHg0OCwgMHg1MCwgMHhmZCwgMHhlZCwgMHhiOSwgMHhkYSwgMHg1ZSwgMHgxNSwgMHg0NiwgMHg1NywgMHhhNywgMHg4ZCwgMHg5ZCwgMHg4NCwgMHg5MCwgMHhkOCwgMHhhYiwgMHgwMCwgMHg4YywgMHhiYywgMHhkMywgMHgwYSwgMHhmNywgMHhlNCwgMHg1OCwgMHgwNSwgMHhiOCwgMHhiMywgMHg0NSwgMHgwNiwgMHhkMCwgMHgyYywgMHgxZSwgMHg4ZiwgMHhjYSwgMHgzZiwgMHgwZiwgMHgwMiwgMHhjMSwgMHhhZiwgMHhiZCwgMHgwMywgMHgwMSwgMHgxMywgMHg4YSwgMHg2YiwgMHgzYSwgMHg5MSwgMHgxMSwgMHg0MSwgMHg0ZiwgMHg2NywgMHhkYywgMHhlYSwgMHg5NywgMHhmMiwgMHhjZiwgMHhjZSwgMHhmMCwgMHhiNCwgMHhlNiwgMHg3MywgMHg5NiwgMHhhYywgMHg3NCwgMHgyMiwgMHhlNywgMHhhZCwgMHgzNSwgMHg4NSwgMHhlMiwgMHhmOSwgMHgzNywgMHhlOCwgMHgxYywgMHg3NSwgMHhkZiwgMHg2ZSwgMHg0NywgMHhmMSwgMHgxYSwgMHg3MSwgMHgxZCwgMHgyOSwgMHhjNSwgMHg4OSwgMHg2ZiwgMHhiNywgMHg2MiwgMHgwZSwgMHhhYSwgMHgxOCwgMHhiZSwgMHgxYiwgMHhmYywgMHg1NiwgMHgzZSwgMHg0YiwgMHhjNiwgMHhkMiwgMHg3OSwgMHgyMCwgMHg5YSwgMHhkYiwgMHhjMCwgMHhmZSwgMHg3OCwgMHhjZCwgMHg1YSwgMHhmNCwgMHgxZiwgMHhkZCwgMHhhOCwgMHgzMywgMHg4OCwgMHgwNywgMHhjNywgMHgzMSwgMHhiMSwgMHgxMiwgMHgxMCwgMHg1OSwgMHgyNywgMHg4MCwgMHhlYywgMHg1ZiwgMHg2MCwgMHg1MSwgMHg3ZiwgMHhhOSwgMHgxOSwgMHhiNSwgMHg0YSwgMHgwZCwgMHgyZCwgMHhlNSwgMHg3YSwgMHg5ZiwgMHg5MywgMHhjOSwgMHg5YywgMHhlZiwgMHhhMCwgMHhlMCwgMHgzYiwgMHg0ZCwgMHhhZSwgMHgyYSwgMHhmNSwgMHhiMCwgMHhjOCwgMHhlYiwgMHhiYiwgMHgzYywgMHg4MywgMHg1MywgMHg5OSwgMHg2MSwgMHgxNywgMHgyYiwgMHgwNCwgMHg3ZSwgMHhiYSwgMHg3NywgMHhkNiwgMHgyNiwgMHhlMSwgMHg2OSwgMHgxNCwgMHg2MywgMHg1NSwgMHgyMSwgMHgwYywgMHg3ZF07XG5cbiAgICAvLyBUcmFuc2Zvcm1hdGlvbnMgZm9yIGVuY3J5cHRpb25cbiAgICB2YXIgVDEgPSBbMHhjNjYzNjNhNSwgMHhmODdjN2M4NCwgMHhlZTc3Nzc5OSwgMHhmNjdiN2I4ZCwgMHhmZmYyZjIwZCwgMHhkNjZiNmJiZCwgMHhkZTZmNmZiMSwgMHg5MWM1YzU1NCwgMHg2MDMwMzA1MCwgMHgwMjAxMDEwMywgMHhjZTY3NjdhOSwgMHg1NjJiMmI3ZCwgMHhlN2ZlZmUxOSwgMHhiNWQ3ZDc2MiwgMHg0ZGFiYWJlNiwgMHhlYzc2NzY5YSwgMHg4ZmNhY2E0NSwgMHgxZjgyODI5ZCwgMHg4OWM5Yzk0MCwgMHhmYTdkN2Q4NywgMHhlZmZhZmExNSwgMHhiMjU5NTllYiwgMHg4ZTQ3NDdjOSwgMHhmYmYwZjAwYiwgMHg0MWFkYWRlYywgMHhiM2Q0ZDQ2NywgMHg1ZmEyYTJmZCwgMHg0NWFmYWZlYSwgMHgyMzljOWNiZiwgMHg1M2E0YTRmNywgMHhlNDcyNzI5NiwgMHg5YmMwYzA1YiwgMHg3NWI3YjdjMiwgMHhlMWZkZmQxYywgMHgzZDkzOTNhZSwgMHg0YzI2MjY2YSwgMHg2YzM2MzY1YSwgMHg3ZTNmM2Y0MSwgMHhmNWY3ZjcwMiwgMHg4M2NjY2M0ZiwgMHg2ODM0MzQ1YywgMHg1MWE1YTVmNCwgMHhkMWU1ZTUzNCwgMHhmOWYxZjEwOCwgMHhlMjcxNzE5MywgMHhhYmQ4ZDg3MywgMHg2MjMxMzE1MywgMHgyYTE1MTUzZiwgMHgwODA0MDQwYywgMHg5NWM3Yzc1MiwgMHg0NjIzMjM2NSwgMHg5ZGMzYzM1ZSwgMHgzMDE4MTgyOCwgMHgzNzk2OTZhMSwgMHgwYTA1MDUwZiwgMHgyZjlhOWFiNSwgMHgwZTA3MDcwOSwgMHgyNDEyMTIzNiwgMHgxYjgwODA5YiwgMHhkZmUyZTIzZCwgMHhjZGViZWIyNiwgMHg0ZTI3Mjc2OSwgMHg3ZmIyYjJjZCwgMHhlYTc1NzU5ZiwgMHgxMjA5MDkxYiwgMHgxZDgzODM5ZSwgMHg1ODJjMmM3NCwgMHgzNDFhMWEyZSwgMHgzNjFiMWIyZCwgMHhkYzZlNmViMiwgMHhiNDVhNWFlZSwgMHg1YmEwYTBmYiwgMHhhNDUyNTJmNiwgMHg3NjNiM2I0ZCwgMHhiN2Q2ZDY2MSwgMHg3ZGIzYjNjZSwgMHg1MjI5Mjk3YiwgMHhkZGUzZTMzZSwgMHg1ZTJmMmY3MSwgMHgxMzg0ODQ5NywgMHhhNjUzNTNmNSwgMHhiOWQxZDE2OCwgMHgwMDAwMDAwMCwgMHhjMWVkZWQyYywgMHg0MDIwMjA2MCwgMHhlM2ZjZmMxZiwgMHg3OWIxYjFjOCwgMHhiNjViNWJlZCwgMHhkNDZhNmFiZSwgMHg4ZGNiY2I0NiwgMHg2N2JlYmVkOSwgMHg3MjM5Mzk0YiwgMHg5NDRhNGFkZSwgMHg5ODRjNGNkNCwgMHhiMDU4NThlOCwgMHg4NWNmY2Y0YSwgMHhiYmQwZDA2YiwgMHhjNWVmZWYyYSwgMHg0ZmFhYWFlNSwgMHhlZGZiZmIxNiwgMHg4NjQzNDNjNSwgMHg5YTRkNGRkNywgMHg2NjMzMzM1NSwgMHgxMTg1ODU5NCwgMHg4YTQ1NDVjZiwgMHhlOWY5ZjkxMCwgMHgwNDAyMDIwNiwgMHhmZTdmN2Y4MSwgMHhhMDUwNTBmMCwgMHg3ODNjM2M0NCwgMHgyNTlmOWZiYSwgMHg0YmE4YThlMywgMHhhMjUxNTFmMywgMHg1ZGEzYTNmZSwgMHg4MDQwNDBjMCwgMHgwNThmOGY4YSwgMHgzZjkyOTJhZCwgMHgyMTlkOWRiYywgMHg3MDM4Mzg0OCwgMHhmMWY1ZjUwNCwgMHg2M2JjYmNkZiwgMHg3N2I2YjZjMSwgMHhhZmRhZGE3NSwgMHg0MjIxMjE2MywgMHgyMDEwMTAzMCwgMHhlNWZmZmYxYSwgMHhmZGYzZjMwZSwgMHhiZmQyZDI2ZCwgMHg4MWNkY2Q0YywgMHgxODBjMGMxNCwgMHgyNjEzMTMzNSwgMHhjM2VjZWMyZiwgMHhiZTVmNWZlMSwgMHgzNTk3OTdhMiwgMHg4ODQ0NDRjYywgMHgyZTE3MTczOSwgMHg5M2M0YzQ1NywgMHg1NWE3YTdmMiwgMHhmYzdlN2U4MiwgMHg3YTNkM2Q0NywgMHhjODY0NjRhYywgMHhiYTVkNWRlNywgMHgzMjE5MTkyYiwgMHhlNjczNzM5NSwgMHhjMDYwNjBhMCwgMHgxOTgxODE5OCwgMHg5ZTRmNGZkMSwgMHhhM2RjZGM3ZiwgMHg0NDIyMjI2NiwgMHg1NDJhMmE3ZSwgMHgzYjkwOTBhYiwgMHgwYjg4ODg4MywgMHg4YzQ2NDZjYSwgMHhjN2VlZWUyOSwgMHg2YmI4YjhkMywgMHgyODE0MTQzYywgMHhhN2RlZGU3OSwgMHhiYzVlNWVlMiwgMHgxNjBiMGIxZCwgMHhhZGRiZGI3NiwgMHhkYmUwZTAzYiwgMHg2NDMyMzI1NiwgMHg3NDNhM2E0ZSwgMHgxNDBhMGExZSwgMHg5MjQ5NDlkYiwgMHgwYzA2MDYwYSwgMHg0ODI0MjQ2YywgMHhiODVjNWNlNCwgMHg5ZmMyYzI1ZCwgMHhiZGQzZDM2ZSwgMHg0M2FjYWNlZiwgMHhjNDYyNjJhNiwgMHgzOTkxOTFhOCwgMHgzMTk1OTVhNCwgMHhkM2U0ZTQzNywgMHhmMjc5Nzk4YiwgMHhkNWU3ZTczMiwgMHg4YmM4Yzg0MywgMHg2ZTM3Mzc1OSwgMHhkYTZkNmRiNywgMHgwMThkOGQ4YywgMHhiMWQ1ZDU2NCwgMHg5YzRlNGVkMiwgMHg0OWE5YTllMCwgMHhkODZjNmNiNCwgMHhhYzU2NTZmYSwgMHhmM2Y0ZjQwNywgMHhjZmVhZWEyNSwgMHhjYTY1NjVhZiwgMHhmNDdhN2E4ZSwgMHg0N2FlYWVlOSwgMHgxMDA4MDgxOCwgMHg2ZmJhYmFkNSwgMHhmMDc4Nzg4OCwgMHg0YTI1MjU2ZiwgMHg1YzJlMmU3MiwgMHgzODFjMWMyNCwgMHg1N2E2YTZmMSwgMHg3M2I0YjRjNywgMHg5N2M2YzY1MSwgMHhjYmU4ZTgyMywgMHhhMWRkZGQ3YywgMHhlODc0NzQ5YywgMHgzZTFmMWYyMSwgMHg5NjRiNGJkZCwgMHg2MWJkYmRkYywgMHgwZDhiOGI4NiwgMHgwZjhhOGE4NSwgMHhlMDcwNzA5MCwgMHg3YzNlM2U0MiwgMHg3MWI1YjVjNCwgMHhjYzY2NjZhYSwgMHg5MDQ4NDhkOCwgMHgwNjAzMDMwNSwgMHhmN2Y2ZjYwMSwgMHgxYzBlMGUxMiwgMHhjMjYxNjFhMywgMHg2YTM1MzU1ZiwgMHhhZTU3NTdmOSwgMHg2OWI5YjlkMCwgMHgxNzg2ODY5MSwgMHg5OWMxYzE1OCwgMHgzYTFkMWQyNywgMHgyNzllOWViOSwgMHhkOWUxZTEzOCwgMHhlYmY4ZjgxMywgMHgyYjk4OThiMywgMHgyMjExMTEzMywgMHhkMjY5NjliYiwgMHhhOWQ5ZDk3MCwgMHgwNzhlOGU4OSwgMHgzMzk0OTRhNywgMHgyZDliOWJiNiwgMHgzYzFlMWUyMiwgMHgxNTg3ODc5MiwgMHhjOWU5ZTkyMCwgMHg4N2NlY2U0OSwgMHhhYTU1NTVmZiwgMHg1MDI4Mjg3OCwgMHhhNWRmZGY3YSwgMHgwMzhjOGM4ZiwgMHg1OWExYTFmOCwgMHgwOTg5ODk4MCwgMHgxYTBkMGQxNywgMHg2NWJmYmZkYSwgMHhkN2U2ZTYzMSwgMHg4NDQyNDJjNiwgMHhkMDY4NjhiOCwgMHg4MjQxNDFjMywgMHgyOTk5OTliMCwgMHg1YTJkMmQ3NywgMHgxZTBmMGYxMSwgMHg3YmIwYjBjYiwgMHhhODU0NTRmYywgMHg2ZGJiYmJkNiwgMHgyYzE2MTYzYV07XG4gICAgdmFyIFQyID0gWzB4YTVjNjYzNjMsIDB4ODRmODdjN2MsIDB4OTllZTc3NzcsIDB4OGRmNjdiN2IsIDB4MGRmZmYyZjIsIDB4YmRkNjZiNmIsIDB4YjFkZTZmNmYsIDB4NTQ5MWM1YzUsIDB4NTA2MDMwMzAsIDB4MDMwMjAxMDEsIDB4YTljZTY3NjcsIDB4N2Q1NjJiMmIsIDB4MTllN2ZlZmUsIDB4NjJiNWQ3ZDcsIDB4ZTY0ZGFiYWIsIDB4OWFlYzc2NzYsIDB4NDU4ZmNhY2EsIDB4OWQxZjgyODIsIDB4NDA4OWM5YzksIDB4ODdmYTdkN2QsIDB4MTVlZmZhZmEsIDB4ZWJiMjU5NTksIDB4Yzk4ZTQ3NDcsIDB4MGJmYmYwZjAsIDB4ZWM0MWFkYWQsIDB4NjdiM2Q0ZDQsIDB4ZmQ1ZmEyYTIsIDB4ZWE0NWFmYWYsIDB4YmYyMzljOWMsIDB4Zjc1M2E0YTQsIDB4OTZlNDcyNzIsIDB4NWI5YmMwYzAsIDB4YzI3NWI3YjcsIDB4MWNlMWZkZmQsIDB4YWUzZDkzOTMsIDB4NmE0YzI2MjYsIDB4NWE2YzM2MzYsIDB4NDE3ZTNmM2YsIDB4MDJmNWY3ZjcsIDB4NGY4M2NjY2MsIDB4NWM2ODM0MzQsIDB4ZjQ1MWE1YTUsIDB4MzRkMWU1ZTUsIDB4MDhmOWYxZjEsIDB4OTNlMjcxNzEsIDB4NzNhYmQ4ZDgsIDB4NTM2MjMxMzEsIDB4M2YyYTE1MTUsIDB4MGMwODA0MDQsIDB4NTI5NWM3YzcsIDB4NjU0NjIzMjMsIDB4NWU5ZGMzYzMsIDB4MjgzMDE4MTgsIDB4YTEzNzk2OTYsIDB4MGYwYTA1MDUsIDB4YjUyZjlhOWEsIDB4MDkwZTA3MDcsIDB4MzYyNDEyMTIsIDB4OWIxYjgwODAsIDB4M2RkZmUyZTIsIDB4MjZjZGViZWIsIDB4Njk0ZTI3MjcsIDB4Y2Q3ZmIyYjIsIDB4OWZlYTc1NzUsIDB4MWIxMjA5MDksIDB4OWUxZDgzODMsIDB4NzQ1ODJjMmMsIDB4MmUzNDFhMWEsIDB4MmQzNjFiMWIsIDB4YjJkYzZlNmUsIDB4ZWViNDVhNWEsIDB4ZmI1YmEwYTAsIDB4ZjZhNDUyNTIsIDB4NGQ3NjNiM2IsIDB4NjFiN2Q2ZDYsIDB4Y2U3ZGIzYjMsIDB4N2I1MjI5MjksIDB4M2VkZGUzZTMsIDB4NzE1ZTJmMmYsIDB4OTcxMzg0ODQsIDB4ZjVhNjUzNTMsIDB4NjhiOWQxZDEsIDB4MDAwMDAwMDAsIDB4MmNjMWVkZWQsIDB4NjA0MDIwMjAsIDB4MWZlM2ZjZmMsIDB4Yzg3OWIxYjEsIDB4ZWRiNjViNWIsIDB4YmVkNDZhNmEsIDB4NDY4ZGNiY2IsIDB4ZDk2N2JlYmUsIDB4NGI3MjM5MzksIDB4ZGU5NDRhNGEsIDB4ZDQ5ODRjNGMsIDB4ZThiMDU4NTgsIDB4NGE4NWNmY2YsIDB4NmJiYmQwZDAsIDB4MmFjNWVmZWYsIDB4ZTU0ZmFhYWEsIDB4MTZlZGZiZmIsIDB4YzU4NjQzNDMsIDB4ZDc5YTRkNGQsIDB4NTU2NjMzMzMsIDB4OTQxMTg1ODUsIDB4Y2Y4YTQ1NDUsIDB4MTBlOWY5ZjksIDB4MDYwNDAyMDIsIDB4ODFmZTdmN2YsIDB4ZjBhMDUwNTAsIDB4NDQ3ODNjM2MsIDB4YmEyNTlmOWYsIDB4ZTM0YmE4YTgsIDB4ZjNhMjUxNTEsIDB4ZmU1ZGEzYTMsIDB4YzA4MDQwNDAsIDB4OGEwNThmOGYsIDB4YWQzZjkyOTIsIDB4YmMyMTlkOWQsIDB4NDg3MDM4MzgsIDB4MDRmMWY1ZjUsIDB4ZGY2M2JjYmMsIDB4YzE3N2I2YjYsIDB4NzVhZmRhZGEsIDB4NjM0MjIxMjEsIDB4MzAyMDEwMTAsIDB4MWFlNWZmZmYsIDB4MGVmZGYzZjMsIDB4NmRiZmQyZDIsIDB4NGM4MWNkY2QsIDB4MTQxODBjMGMsIDB4MzUyNjEzMTMsIDB4MmZjM2VjZWMsIDB4ZTFiZTVmNWYsIDB4YTIzNTk3OTcsIDB4Y2M4ODQ0NDQsIDB4MzkyZTE3MTcsIDB4NTc5M2M0YzQsIDB4ZjI1NWE3YTcsIDB4ODJmYzdlN2UsIDB4NDc3YTNkM2QsIDB4YWNjODY0NjQsIDB4ZTdiYTVkNWQsIDB4MmIzMjE5MTksIDB4OTVlNjczNzMsIDB4YTBjMDYwNjAsIDB4OTgxOTgxODEsIDB4ZDE5ZTRmNGYsIDB4N2ZhM2RjZGMsIDB4NjY0NDIyMjIsIDB4N2U1NDJhMmEsIDB4YWIzYjkwOTAsIDB4ODMwYjg4ODgsIDB4Y2E4YzQ2NDYsIDB4MjljN2VlZWUsIDB4ZDM2YmI4YjgsIDB4M2MyODE0MTQsIDB4NzlhN2RlZGUsIDB4ZTJiYzVlNWUsIDB4MWQxNjBiMGIsIDB4NzZhZGRiZGIsIDB4M2JkYmUwZTAsIDB4NTY2NDMyMzIsIDB4NGU3NDNhM2EsIDB4MWUxNDBhMGEsIDB4ZGI5MjQ5NDksIDB4MGEwYzA2MDYsIDB4NmM0ODI0MjQsIDB4ZTRiODVjNWMsIDB4NWQ5ZmMyYzIsIDB4NmViZGQzZDMsIDB4ZWY0M2FjYWMsIDB4YTZjNDYyNjIsIDB4YTgzOTkxOTEsIDB4YTQzMTk1OTUsIDB4MzdkM2U0ZTQsIDB4OGJmMjc5NzksIDB4MzJkNWU3ZTcsIDB4NDM4YmM4YzgsIDB4NTk2ZTM3MzcsIDB4YjdkYTZkNmQsIDB4OGMwMThkOGQsIDB4NjRiMWQ1ZDUsIDB4ZDI5YzRlNGUsIDB4ZTA0OWE5YTksIDB4YjRkODZjNmMsIDB4ZmFhYzU2NTYsIDB4MDdmM2Y0ZjQsIDB4MjVjZmVhZWEsIDB4YWZjYTY1NjUsIDB4OGVmNDdhN2EsIDB4ZTk0N2FlYWUsIDB4MTgxMDA4MDgsIDB4ZDU2ZmJhYmEsIDB4ODhmMDc4NzgsIDB4NmY0YTI1MjUsIDB4NzI1YzJlMmUsIDB4MjQzODFjMWMsIDB4ZjE1N2E2YTYsIDB4Yzc3M2I0YjQsIDB4NTE5N2M2YzYsIDB4MjNjYmU4ZTgsIDB4N2NhMWRkZGQsIDB4OWNlODc0NzQsIDB4MjEzZTFmMWYsIDB4ZGQ5NjRiNGIsIDB4ZGM2MWJkYmQsIDB4ODYwZDhiOGIsIDB4ODUwZjhhOGEsIDB4OTBlMDcwNzAsIDB4NDI3YzNlM2UsIDB4YzQ3MWI1YjUsIDB4YWFjYzY2NjYsIDB4ZDg5MDQ4NDgsIDB4MDUwNjAzMDMsIDB4MDFmN2Y2ZjYsIDB4MTIxYzBlMGUsIDB4YTNjMjYxNjEsIDB4NWY2YTM1MzUsIDB4ZjlhZTU3NTcsIDB4ZDA2OWI5YjksIDB4OTExNzg2ODYsIDB4NTg5OWMxYzEsIDB4MjczYTFkMWQsIDB4YjkyNzllOWUsIDB4MzhkOWUxZTEsIDB4MTNlYmY4ZjgsIDB4YjMyYjk4OTgsIDB4MzMyMjExMTEsIDB4YmJkMjY5NjksIDB4NzBhOWQ5ZDksIDB4ODkwNzhlOGUsIDB4YTczMzk0OTQsIDB4YjYyZDliOWIsIDB4MjIzYzFlMWUsIDB4OTIxNTg3ODcsIDB4MjBjOWU5ZTksIDB4NDk4N2NlY2UsIDB4ZmZhYTU1NTUsIDB4Nzg1MDI4MjgsIDB4N2FhNWRmZGYsIDB4OGYwMzhjOGMsIDB4Zjg1OWExYTEsIDB4ODAwOTg5ODksIDB4MTcxYTBkMGQsIDB4ZGE2NWJmYmYsIDB4MzFkN2U2ZTYsIDB4YzY4NDQyNDIsIDB4YjhkMDY4NjgsIDB4YzM4MjQxNDEsIDB4YjAyOTk5OTksIDB4Nzc1YTJkMmQsIDB4MTExZTBmMGYsIDB4Y2I3YmIwYjAsIDB4ZmNhODU0NTQsIDB4ZDY2ZGJiYmIsIDB4M2EyYzE2MTZdO1xuICAgIHZhciBUMyA9IFsweDYzYTVjNjYzLCAweDdjODRmODdjLCAweDc3OTllZTc3LCAweDdiOGRmNjdiLCAweGYyMGRmZmYyLCAweDZiYmRkNjZiLCAweDZmYjFkZTZmLCAweGM1NTQ5MWM1LCAweDMwNTA2MDMwLCAweDAxMDMwMjAxLCAweDY3YTljZTY3LCAweDJiN2Q1NjJiLCAweGZlMTllN2ZlLCAweGQ3NjJiNWQ3LCAweGFiZTY0ZGFiLCAweDc2OWFlYzc2LCAweGNhNDU4ZmNhLCAweDgyOWQxZjgyLCAweGM5NDA4OWM5LCAweDdkODdmYTdkLCAweGZhMTVlZmZhLCAweDU5ZWJiMjU5LCAweDQ3Yzk4ZTQ3LCAweGYwMGJmYmYwLCAweGFkZWM0MWFkLCAweGQ0NjdiM2Q0LCAweGEyZmQ1ZmEyLCAweGFmZWE0NWFmLCAweDljYmYyMzljLCAweGE0Zjc1M2E0LCAweDcyOTZlNDcyLCAweGMwNWI5YmMwLCAweGI3YzI3NWI3LCAweGZkMWNlMWZkLCAweDkzYWUzZDkzLCAweDI2NmE0YzI2LCAweDM2NWE2YzM2LCAweDNmNDE3ZTNmLCAweGY3MDJmNWY3LCAweGNjNGY4M2NjLCAweDM0NWM2ODM0LCAweGE1ZjQ1MWE1LCAweGU1MzRkMWU1LCAweGYxMDhmOWYxLCAweDcxOTNlMjcxLCAweGQ4NzNhYmQ4LCAweDMxNTM2MjMxLCAweDE1M2YyYTE1LCAweDA0MGMwODA0LCAweGM3NTI5NWM3LCAweDIzNjU0NjIzLCAweGMzNWU5ZGMzLCAweDE4MjgzMDE4LCAweDk2YTEzNzk2LCAweDA1MGYwYTA1LCAweDlhYjUyZjlhLCAweDA3MDkwZTA3LCAweDEyMzYyNDEyLCAweDgwOWIxYjgwLCAweGUyM2RkZmUyLCAweGViMjZjZGViLCAweDI3Njk0ZTI3LCAweGIyY2Q3ZmIyLCAweDc1OWZlYTc1LCAweDA5MWIxMjA5LCAweDgzOWUxZDgzLCAweDJjNzQ1ODJjLCAweDFhMmUzNDFhLCAweDFiMmQzNjFiLCAweDZlYjJkYzZlLCAweDVhZWViNDVhLCAweGEwZmI1YmEwLCAweDUyZjZhNDUyLCAweDNiNGQ3NjNiLCAweGQ2NjFiN2Q2LCAweGIzY2U3ZGIzLCAweDI5N2I1MjI5LCAweGUzM2VkZGUzLCAweDJmNzE1ZTJmLCAweDg0OTcxMzg0LCAweDUzZjVhNjUzLCAweGQxNjhiOWQxLCAweDAwMDAwMDAwLCAweGVkMmNjMWVkLCAweDIwNjA0MDIwLCAweGZjMWZlM2ZjLCAweGIxYzg3OWIxLCAweDViZWRiNjViLCAweDZhYmVkNDZhLCAweGNiNDY4ZGNiLCAweGJlZDk2N2JlLCAweDM5NGI3MjM5LCAweDRhZGU5NDRhLCAweDRjZDQ5ODRjLCAweDU4ZThiMDU4LCAweGNmNGE4NWNmLCAweGQwNmJiYmQwLCAweGVmMmFjNWVmLCAweGFhZTU0ZmFhLCAweGZiMTZlZGZiLCAweDQzYzU4NjQzLCAweDRkZDc5YTRkLCAweDMzNTU2NjMzLCAweDg1OTQxMTg1LCAweDQ1Y2Y4YTQ1LCAweGY5MTBlOWY5LCAweDAyMDYwNDAyLCAweDdmODFmZTdmLCAweDUwZjBhMDUwLCAweDNjNDQ3ODNjLCAweDlmYmEyNTlmLCAweGE4ZTM0YmE4LCAweDUxZjNhMjUxLCAweGEzZmU1ZGEzLCAweDQwYzA4MDQwLCAweDhmOGEwNThmLCAweDkyYWQzZjkyLCAweDlkYmMyMTlkLCAweDM4NDg3MDM4LCAweGY1MDRmMWY1LCAweGJjZGY2M2JjLCAweGI2YzE3N2I2LCAweGRhNzVhZmRhLCAweDIxNjM0MjIxLCAweDEwMzAyMDEwLCAweGZmMWFlNWZmLCAweGYzMGVmZGYzLCAweGQyNmRiZmQyLCAweGNkNGM4MWNkLCAweDBjMTQxODBjLCAweDEzMzUyNjEzLCAweGVjMmZjM2VjLCAweDVmZTFiZTVmLCAweDk3YTIzNTk3LCAweDQ0Y2M4ODQ0LCAweDE3MzkyZTE3LCAweGM0NTc5M2M0LCAweGE3ZjI1NWE3LCAweDdlODJmYzdlLCAweDNkNDc3YTNkLCAweDY0YWNjODY0LCAweDVkZTdiYTVkLCAweDE5MmIzMjE5LCAweDczOTVlNjczLCAweDYwYTBjMDYwLCAweDgxOTgxOTgxLCAweDRmZDE5ZTRmLCAweGRjN2ZhM2RjLCAweDIyNjY0NDIyLCAweDJhN2U1NDJhLCAweDkwYWIzYjkwLCAweDg4ODMwYjg4LCAweDQ2Y2E4YzQ2LCAweGVlMjljN2VlLCAweGI4ZDM2YmI4LCAweDE0M2MyODE0LCAweGRlNzlhN2RlLCAweDVlZTJiYzVlLCAweDBiMWQxNjBiLCAweGRiNzZhZGRiLCAweGUwM2JkYmUwLCAweDMyNTY2NDMyLCAweDNhNGU3NDNhLCAweDBhMWUxNDBhLCAweDQ5ZGI5MjQ5LCAweDA2MGEwYzA2LCAweDI0NmM0ODI0LCAweDVjZTRiODVjLCAweGMyNWQ5ZmMyLCAweGQzNmViZGQzLCAweGFjZWY0M2FjLCAweDYyYTZjNDYyLCAweDkxYTgzOTkxLCAweDk1YTQzMTk1LCAweGU0MzdkM2U0LCAweDc5OGJmMjc5LCAweGU3MzJkNWU3LCAweGM4NDM4YmM4LCAweDM3NTk2ZTM3LCAweDZkYjdkYTZkLCAweDhkOGMwMThkLCAweGQ1NjRiMWQ1LCAweDRlZDI5YzRlLCAweGE5ZTA0OWE5LCAweDZjYjRkODZjLCAweDU2ZmFhYzU2LCAweGY0MDdmM2Y0LCAweGVhMjVjZmVhLCAweDY1YWZjYTY1LCAweDdhOGVmNDdhLCAweGFlZTk0N2FlLCAweDA4MTgxMDA4LCAweGJhZDU2ZmJhLCAweDc4ODhmMDc4LCAweDI1NmY0YTI1LCAweDJlNzI1YzJlLCAweDFjMjQzODFjLCAweGE2ZjE1N2E2LCAweGI0Yzc3M2I0LCAweGM2NTE5N2M2LCAweGU4MjNjYmU4LCAweGRkN2NhMWRkLCAweDc0OWNlODc0LCAweDFmMjEzZTFmLCAweDRiZGQ5NjRiLCAweGJkZGM2MWJkLCAweDhiODYwZDhiLCAweDhhODUwZjhhLCAweDcwOTBlMDcwLCAweDNlNDI3YzNlLCAweGI1YzQ3MWI1LCAweDY2YWFjYzY2LCAweDQ4ZDg5MDQ4LCAweDAzMDUwNjAzLCAweGY2MDFmN2Y2LCAweDBlMTIxYzBlLCAweDYxYTNjMjYxLCAweDM1NWY2YTM1LCAweDU3ZjlhZTU3LCAweGI5ZDA2OWI5LCAweDg2OTExNzg2LCAweGMxNTg5OWMxLCAweDFkMjczYTFkLCAweDllYjkyNzllLCAweGUxMzhkOWUxLCAweGY4MTNlYmY4LCAweDk4YjMyYjk4LCAweDExMzMyMjExLCAweDY5YmJkMjY5LCAweGQ5NzBhOWQ5LCAweDhlODkwNzhlLCAweDk0YTczMzk0LCAweDliYjYyZDliLCAweDFlMjIzYzFlLCAweDg3OTIxNTg3LCAweGU5MjBjOWU5LCAweGNlNDk4N2NlLCAweDU1ZmZhYTU1LCAweDI4Nzg1MDI4LCAweGRmN2FhNWRmLCAweDhjOGYwMzhjLCAweGExZjg1OWExLCAweDg5ODAwOTg5LCAweDBkMTcxYTBkLCAweGJmZGE2NWJmLCAweGU2MzFkN2U2LCAweDQyYzY4NDQyLCAweDY4YjhkMDY4LCAweDQxYzM4MjQxLCAweDk5YjAyOTk5LCAweDJkNzc1YTJkLCAweDBmMTExZTBmLCAweGIwY2I3YmIwLCAweDU0ZmNhODU0LCAweGJiZDY2ZGJiLCAweDE2M2EyYzE2XTtcbiAgICB2YXIgVDQgPSBbMHg2MzYzYTVjNiwgMHg3YzdjODRmOCwgMHg3Nzc3OTllZSwgMHg3YjdiOGRmNiwgMHhmMmYyMGRmZiwgMHg2YjZiYmRkNiwgMHg2ZjZmYjFkZSwgMHhjNWM1NTQ5MSwgMHgzMDMwNTA2MCwgMHgwMTAxMDMwMiwgMHg2NzY3YTljZSwgMHgyYjJiN2Q1NiwgMHhmZWZlMTllNywgMHhkN2Q3NjJiNSwgMHhhYmFiZTY0ZCwgMHg3Njc2OWFlYywgMHhjYWNhNDU4ZiwgMHg4MjgyOWQxZiwgMHhjOWM5NDA4OSwgMHg3ZDdkODdmYSwgMHhmYWZhMTVlZiwgMHg1OTU5ZWJiMiwgMHg0NzQ3Yzk4ZSwgMHhmMGYwMGJmYiwgMHhhZGFkZWM0MSwgMHhkNGQ0NjdiMywgMHhhMmEyZmQ1ZiwgMHhhZmFmZWE0NSwgMHg5YzljYmYyMywgMHhhNGE0Zjc1MywgMHg3MjcyOTZlNCwgMHhjMGMwNWI5YiwgMHhiN2I3YzI3NSwgMHhmZGZkMWNlMSwgMHg5MzkzYWUzZCwgMHgyNjI2NmE0YywgMHgzNjM2NWE2YywgMHgzZjNmNDE3ZSwgMHhmN2Y3MDJmNSwgMHhjY2NjNGY4MywgMHgzNDM0NWM2OCwgMHhhNWE1ZjQ1MSwgMHhlNWU1MzRkMSwgMHhmMWYxMDhmOSwgMHg3MTcxOTNlMiwgMHhkOGQ4NzNhYiwgMHgzMTMxNTM2MiwgMHgxNTE1M2YyYSwgMHgwNDA0MGMwOCwgMHhjN2M3NTI5NSwgMHgyMzIzNjU0NiwgMHhjM2MzNWU5ZCwgMHgxODE4MjgzMCwgMHg5Njk2YTEzNywgMHgwNTA1MGYwYSwgMHg5YTlhYjUyZiwgMHgwNzA3MDkwZSwgMHgxMjEyMzYyNCwgMHg4MDgwOWIxYiwgMHhlMmUyM2RkZiwgMHhlYmViMjZjZCwgMHgyNzI3Njk0ZSwgMHhiMmIyY2Q3ZiwgMHg3NTc1OWZlYSwgMHgwOTA5MWIxMiwgMHg4MzgzOWUxZCwgMHgyYzJjNzQ1OCwgMHgxYTFhMmUzNCwgMHgxYjFiMmQzNiwgMHg2ZTZlYjJkYywgMHg1YTVhZWViNCwgMHhhMGEwZmI1YiwgMHg1MjUyZjZhNCwgMHgzYjNiNGQ3NiwgMHhkNmQ2NjFiNywgMHhiM2IzY2U3ZCwgMHgyOTI5N2I1MiwgMHhlM2UzM2VkZCwgMHgyZjJmNzE1ZSwgMHg4NDg0OTcxMywgMHg1MzUzZjVhNiwgMHhkMWQxNjhiOSwgMHgwMDAwMDAwMCwgMHhlZGVkMmNjMSwgMHgyMDIwNjA0MCwgMHhmY2ZjMWZlMywgMHhiMWIxYzg3OSwgMHg1YjViZWRiNiwgMHg2YTZhYmVkNCwgMHhjYmNiNDY4ZCwgMHhiZWJlZDk2NywgMHgzOTM5NGI3MiwgMHg0YTRhZGU5NCwgMHg0YzRjZDQ5OCwgMHg1ODU4ZThiMCwgMHhjZmNmNGE4NSwgMHhkMGQwNmJiYiwgMHhlZmVmMmFjNSwgMHhhYWFhZTU0ZiwgMHhmYmZiMTZlZCwgMHg0MzQzYzU4NiwgMHg0ZDRkZDc5YSwgMHgzMzMzNTU2NiwgMHg4NTg1OTQxMSwgMHg0NTQ1Y2Y4YSwgMHhmOWY5MTBlOSwgMHgwMjAyMDYwNCwgMHg3ZjdmODFmZSwgMHg1MDUwZjBhMCwgMHgzYzNjNDQ3OCwgMHg5ZjlmYmEyNSwgMHhhOGE4ZTM0YiwgMHg1MTUxZjNhMiwgMHhhM2EzZmU1ZCwgMHg0MDQwYzA4MCwgMHg4ZjhmOGEwNSwgMHg5MjkyYWQzZiwgMHg5ZDlkYmMyMSwgMHgzODM4NDg3MCwgMHhmNWY1MDRmMSwgMHhiY2JjZGY2MywgMHhiNmI2YzE3NywgMHhkYWRhNzVhZiwgMHgyMTIxNjM0MiwgMHgxMDEwMzAyMCwgMHhmZmZmMWFlNSwgMHhmM2YzMGVmZCwgMHhkMmQyNmRiZiwgMHhjZGNkNGM4MSwgMHgwYzBjMTQxOCwgMHgxMzEzMzUyNiwgMHhlY2VjMmZjMywgMHg1ZjVmZTFiZSwgMHg5Nzk3YTIzNSwgMHg0NDQ0Y2M4OCwgMHgxNzE3MzkyZSwgMHhjNGM0NTc5MywgMHhhN2E3ZjI1NSwgMHg3ZTdlODJmYywgMHgzZDNkNDc3YSwgMHg2NDY0YWNjOCwgMHg1ZDVkZTdiYSwgMHgxOTE5MmIzMiwgMHg3MzczOTVlNiwgMHg2MDYwYTBjMCwgMHg4MTgxOTgxOSwgMHg0ZjRmZDE5ZSwgMHhkY2RjN2ZhMywgMHgyMjIyNjY0NCwgMHgyYTJhN2U1NCwgMHg5MDkwYWIzYiwgMHg4ODg4ODMwYiwgMHg0NjQ2Y2E4YywgMHhlZWVlMjljNywgMHhiOGI4ZDM2YiwgMHgxNDE0M2MyOCwgMHhkZWRlNzlhNywgMHg1ZTVlZTJiYywgMHgwYjBiMWQxNiwgMHhkYmRiNzZhZCwgMHhlMGUwM2JkYiwgMHgzMjMyNTY2NCwgMHgzYTNhNGU3NCwgMHgwYTBhMWUxNCwgMHg0OTQ5ZGI5MiwgMHgwNjA2MGEwYywgMHgyNDI0NmM0OCwgMHg1YzVjZTRiOCwgMHhjMmMyNWQ5ZiwgMHhkM2QzNmViZCwgMHhhY2FjZWY0MywgMHg2MjYyYTZjNCwgMHg5MTkxYTgzOSwgMHg5NTk1YTQzMSwgMHhlNGU0MzdkMywgMHg3OTc5OGJmMiwgMHhlN2U3MzJkNSwgMHhjOGM4NDM4YiwgMHgzNzM3NTk2ZSwgMHg2ZDZkYjdkYSwgMHg4ZDhkOGMwMSwgMHhkNWQ1NjRiMSwgMHg0ZTRlZDI5YywgMHhhOWE5ZTA0OSwgMHg2YzZjYjRkOCwgMHg1NjU2ZmFhYywgMHhmNGY0MDdmMywgMHhlYWVhMjVjZiwgMHg2NTY1YWZjYSwgMHg3YTdhOGVmNCwgMHhhZWFlZTk0NywgMHgwODA4MTgxMCwgMHhiYWJhZDU2ZiwgMHg3ODc4ODhmMCwgMHgyNTI1NmY0YSwgMHgyZTJlNzI1YywgMHgxYzFjMjQzOCwgMHhhNmE2ZjE1NywgMHhiNGI0Yzc3MywgMHhjNmM2NTE5NywgMHhlOGU4MjNjYiwgMHhkZGRkN2NhMSwgMHg3NDc0OWNlOCwgMHgxZjFmMjEzZSwgMHg0YjRiZGQ5NiwgMHhiZGJkZGM2MSwgMHg4YjhiODYwZCwgMHg4YThhODUwZiwgMHg3MDcwOTBlMCwgMHgzZTNlNDI3YywgMHhiNWI1YzQ3MSwgMHg2NjY2YWFjYywgMHg0ODQ4ZDg5MCwgMHgwMzAzMDUwNiwgMHhmNmY2MDFmNywgMHgwZTBlMTIxYywgMHg2MTYxYTNjMiwgMHgzNTM1NWY2YSwgMHg1NzU3ZjlhZSwgMHhiOWI5ZDA2OSwgMHg4Njg2OTExNywgMHhjMWMxNTg5OSwgMHgxZDFkMjczYSwgMHg5ZTllYjkyNywgMHhlMWUxMzhkOSwgMHhmOGY4MTNlYiwgMHg5ODk4YjMyYiwgMHgxMTExMzMyMiwgMHg2OTY5YmJkMiwgMHhkOWQ5NzBhOSwgMHg4ZThlODkwNywgMHg5NDk0YTczMywgMHg5YjliYjYyZCwgMHgxZTFlMjIzYywgMHg4Nzg3OTIxNSwgMHhlOWU5MjBjOSwgMHhjZWNlNDk4NywgMHg1NTU1ZmZhYSwgMHgyODI4Nzg1MCwgMHhkZmRmN2FhNSwgMHg4YzhjOGYwMywgMHhhMWExZjg1OSwgMHg4OTg5ODAwOSwgMHgwZDBkMTcxYSwgMHhiZmJmZGE2NSwgMHhlNmU2MzFkNywgMHg0MjQyYzY4NCwgMHg2ODY4YjhkMCwgMHg0MTQxYzM4MiwgMHg5OTk5YjAyOSwgMHgyZDJkNzc1YSwgMHgwZjBmMTExZSwgMHhiMGIwY2I3YiwgMHg1NDU0ZmNhOCwgMHhiYmJiZDY2ZCwgMHgxNjE2M2EyY107XG5cbiAgICAvLyBUcmFuc2Zvcm1hdGlvbnMgZm9yIGRlY3J5cHRpb25cbiAgICB2YXIgVDUgPSBbMHg1MWY0YTc1MCwgMHg3ZTQxNjU1MywgMHgxYTE3YTRjMywgMHgzYTI3NWU5NiwgMHgzYmFiNmJjYiwgMHgxZjlkNDVmMSwgMHhhY2ZhNThhYiwgMHg0YmUzMDM5MywgMHgyMDMwZmE1NSwgMHhhZDc2NmRmNiwgMHg4OGNjNzY5MSwgMHhmNTAyNGMyNSwgMHg0ZmU1ZDdmYywgMHhjNTJhY2JkNywgMHgyNjM1NDQ4MCwgMHhiNTYyYTM4ZiwgMHhkZWIxNWE0OSwgMHgyNWJhMWI2NywgMHg0NWVhMGU5OCwgMHg1ZGZlYzBlMSwgMHhjMzJmNzUwMiwgMHg4MTRjZjAxMiwgMHg4ZDQ2OTdhMywgMHg2YmQzZjljNiwgMHgwMzhmNWZlNywgMHgxNTkyOWM5NSwgMHhiZjZkN2FlYiwgMHg5NTUyNTlkYSwgMHhkNGJlODMyZCwgMHg1ODc0MjFkMywgMHg0OWUwNjkyOSwgMHg4ZWM5Yzg0NCwgMHg3NWMyODk2YSwgMHhmNDhlNzk3OCwgMHg5OTU4M2U2YiwgMHgyN2I5NzFkZCwgMHhiZWUxNGZiNiwgMHhmMDg4YWQxNywgMHhjOTIwYWM2NiwgMHg3ZGNlM2FiNCwgMHg2M2RmNGExOCwgMHhlNTFhMzE4MiwgMHg5NzUxMzM2MCwgMHg2MjUzN2Y0NSwgMHhiMTY0NzdlMCwgMHhiYjZiYWU4NCwgMHhmZTgxYTAxYywgMHhmOTA4MmI5NCwgMHg3MDQ4Njg1OCwgMHg4ZjQ1ZmQxOSwgMHg5NGRlNmM4NywgMHg1MjdiZjhiNywgMHhhYjczZDMyMywgMHg3MjRiMDJlMiwgMHhlMzFmOGY1NywgMHg2NjU1YWIyYSwgMHhiMmViMjgwNywgMHgyZmI1YzIwMywgMHg4NmM1N2I5YSwgMHhkMzM3MDhhNSwgMHgzMDI4ODdmMiwgMHgyM2JmYTViMiwgMHgwMjAzNmFiYSwgMHhlZDE2ODI1YywgMHg4YWNmMWMyYiwgMHhhNzc5YjQ5MiwgMHhmMzA3ZjJmMCwgMHg0ZTY5ZTJhMSwgMHg2NWRhZjRjZCwgMHgwNjA1YmVkNSwgMHhkMTM0NjIxZiwgMHhjNGE2ZmU4YSwgMHgzNDJlNTM5ZCwgMHhhMmYzNTVhMCwgMHgwNThhZTEzMiwgMHhhNGY2ZWI3NSwgMHgwYjgzZWMzOSwgMHg0MDYwZWZhYSwgMHg1ZTcxOWYwNiwgMHhiZDZlMTA1MSwgMHgzZTIxOGFmOSwgMHg5NmRkMDYzZCwgMHhkZDNlMDVhZSwgMHg0ZGU2YmQ0NiwgMHg5MTU0OGRiNSwgMHg3MWM0NWQwNSwgMHgwNDA2ZDQ2ZiwgMHg2MDUwMTVmZiwgMHgxOTk4ZmIyNCwgMHhkNmJkZTk5NywgMHg4OTQwNDNjYywgMHg2N2Q5OWU3NywgMHhiMGU4NDJiZCwgMHgwNzg5OGI4OCwgMHhlNzE5NWIzOCwgMHg3OWM4ZWVkYiwgMHhhMTdjMGE0NywgMHg3YzQyMGZlOSwgMHhmODg0MWVjOSwgMHgwMDAwMDAwMCwgMHgwOTgwODY4MywgMHgzMjJiZWQ0OCwgMHgxZTExNzBhYywgMHg2YzVhNzI0ZSwgMHhmZDBlZmZmYiwgMHgwZjg1Mzg1NiwgMHgzZGFlZDUxZSwgMHgzNjJkMzkyNywgMHgwYTBmZDk2NCwgMHg2ODVjYTYyMSwgMHg5YjViNTRkMSwgMHgyNDM2MmUzYSwgMHgwYzBhNjdiMSwgMHg5MzU3ZTcwZiwgMHhiNGVlOTZkMiwgMHgxYjliOTE5ZSwgMHg4MGMwYzU0ZiwgMHg2MWRjMjBhMiwgMHg1YTc3NGI2OSwgMHgxYzEyMWExNiwgMHhlMjkzYmEwYSwgMHhjMGEwMmFlNSwgMHgzYzIyZTA0MywgMHgxMjFiMTcxZCwgMHgwZTA5MGQwYiwgMHhmMjhiYzdhZCwgMHgyZGI2YThiOSwgMHgxNDFlYTljOCwgMHg1N2YxMTk4NSwgMHhhZjc1MDc0YywgMHhlZTk5ZGRiYiwgMHhhMzdmNjBmZCwgMHhmNzAxMjY5ZiwgMHg1YzcyZjViYywgMHg0NDY2M2JjNSwgMHg1YmZiN2UzNCwgMHg4YjQzMjk3NiwgMHhjYjIzYzZkYywgMHhiNmVkZmM2OCwgMHhiOGU0ZjE2MywgMHhkNzMxZGNjYSwgMHg0MjYzODUxMCwgMHgxMzk3MjI0MCwgMHg4NGM2MTEyMCwgMHg4NTRhMjQ3ZCwgMHhkMmJiM2RmOCwgMHhhZWY5MzIxMSwgMHhjNzI5YTE2ZCwgMHgxZDllMmY0YiwgMHhkY2IyMzBmMywgMHgwZDg2NTJlYywgMHg3N2MxZTNkMCwgMHgyYmIzMTY2YywgMHhhOTcwYjk5OSwgMHgxMTk0NDhmYSwgMHg0N2U5NjQyMiwgMHhhOGZjOGNjNCwgMHhhMGYwM2YxYSwgMHg1NjdkMmNkOCwgMHgyMjMzOTBlZiwgMHg4NzQ5NGVjNywgMHhkOTM4ZDFjMSwgMHg4Y2NhYTJmZSwgMHg5OGQ0MGIzNiwgMHhhNmY1ODFjZiwgMHhhNTdhZGUyOCwgMHhkYWI3OGUyNiwgMHgzZmFkYmZhNCwgMHgyYzNhOWRlNCwgMHg1MDc4OTIwZCwgMHg2YTVmY2M5YiwgMHg1NDdlNDY2MiwgMHhmNjhkMTNjMiwgMHg5MGQ4YjhlOCwgMHgyZTM5Zjc1ZSwgMHg4MmMzYWZmNSwgMHg5ZjVkODBiZSwgMHg2OWQwOTM3YywgMHg2ZmQ1MmRhOSwgMHhjZjI1MTJiMywgMHhjOGFjOTkzYiwgMHgxMDE4N2RhNywgMHhlODljNjM2ZSwgMHhkYjNiYmI3YiwgMHhjZDI2NzgwOSwgMHg2ZTU5MThmNCwgMHhlYzlhYjcwMSwgMHg4MzRmOWFhOCwgMHhlNjk1NmU2NSwgMHhhYWZmZTY3ZSwgMHgyMWJjY2YwOCwgMHhlZjE1ZThlNiwgMHhiYWU3OWJkOSwgMHg0YTZmMzZjZSwgMHhlYTlmMDlkNCwgMHgyOWIwN2NkNiwgMHgzMWE0YjJhZiwgMHgyYTNmMjMzMSwgMHhjNmE1OTQzMCwgMHgzNWEyNjZjMCwgMHg3NDRlYmMzNywgMHhmYzgyY2FhNiwgMHhlMDkwZDBiMCwgMHgzM2E3ZDgxNSwgMHhmMTA0OTg0YSwgMHg0MWVjZGFmNywgMHg3ZmNkNTAwZSwgMHgxNzkxZjYyZiwgMHg3NjRkZDY4ZCwgMHg0M2VmYjA0ZCwgMHhjY2FhNGQ1NCwgMHhlNDk2MDRkZiwgMHg5ZWQxYjVlMywgMHg0YzZhODgxYiwgMHhjMTJjMWZiOCwgMHg0NjY1NTE3ZiwgMHg5ZDVlZWEwNCwgMHgwMThjMzU1ZCwgMHhmYTg3NzQ3MywgMHhmYjBiNDEyZSwgMHhiMzY3MWQ1YSwgMHg5MmRiZDI1MiwgMHhlOTEwNTYzMywgMHg2ZGQ2NDcxMywgMHg5YWQ3NjE4YywgMHgzN2ExMGM3YSwgMHg1OWY4MTQ4ZSwgMHhlYjEzM2M4OSwgMHhjZWE5MjdlZSwgMHhiNzYxYzkzNSwgMHhlMTFjZTVlZCwgMHg3YTQ3YjEzYywgMHg5Y2QyZGY1OSwgMHg1NWYyNzMzZiwgMHgxODE0Y2U3OSwgMHg3M2M3MzdiZiwgMHg1M2Y3Y2RlYSwgMHg1ZmZkYWE1YiwgMHhkZjNkNmYxNCwgMHg3ODQ0ZGI4NiwgMHhjYWFmZjM4MSwgMHhiOTY4YzQzZSwgMHgzODI0MzQyYywgMHhjMmEzNDA1ZiwgMHgxNjFkYzM3MiwgMHhiY2UyMjUwYywgMHgyODNjNDk4YiwgMHhmZjBkOTU0MSwgMHgzOWE4MDE3MSwgMHgwODBjYjNkZSwgMHhkOGI0ZTQ5YywgMHg2NDU2YzE5MCwgMHg3YmNiODQ2MSwgMHhkNTMyYjY3MCwgMHg0ODZjNWM3NCwgMHhkMGI4NTc0Ml07XG4gICAgdmFyIFQ2ID0gWzB4NTA1MWY0YTcsIDB4NTM3ZTQxNjUsIDB4YzMxYTE3YTQsIDB4OTYzYTI3NWUsIDB4Y2IzYmFiNmIsIDB4ZjExZjlkNDUsIDB4YWJhY2ZhNTgsIDB4OTM0YmUzMDMsIDB4NTUyMDMwZmEsIDB4ZjZhZDc2NmQsIDB4OTE4OGNjNzYsIDB4MjVmNTAyNGMsIDB4ZmM0ZmU1ZDcsIDB4ZDdjNTJhY2IsIDB4ODAyNjM1NDQsIDB4OGZiNTYyYTMsIDB4NDlkZWIxNWEsIDB4NjcyNWJhMWIsIDB4OTg0NWVhMGUsIDB4ZTE1ZGZlYzAsIDB4MDJjMzJmNzUsIDB4MTI4MTRjZjAsIDB4YTM4ZDQ2OTcsIDB4YzY2YmQzZjksIDB4ZTcwMzhmNWYsIDB4OTUxNTkyOWMsIDB4ZWJiZjZkN2EsIDB4ZGE5NTUyNTksIDB4MmRkNGJlODMsIDB4ZDM1ODc0MjEsIDB4Mjk0OWUwNjksIDB4NDQ4ZWM5YzgsIDB4NmE3NWMyODksIDB4NzhmNDhlNzksIDB4NmI5OTU4M2UsIDB4ZGQyN2I5NzEsIDB4YjZiZWUxNGYsIDB4MTdmMDg4YWQsIDB4NjZjOTIwYWMsIDB4YjQ3ZGNlM2EsIDB4MTg2M2RmNGEsIDB4ODJlNTFhMzEsIDB4NjA5NzUxMzMsIDB4NDU2MjUzN2YsIDB4ZTBiMTY0NzcsIDB4ODRiYjZiYWUsIDB4MWNmZTgxYTAsIDB4OTRmOTA4MmIsIDB4NTg3MDQ4NjgsIDB4MTk4ZjQ1ZmQsIDB4ODc5NGRlNmMsIDB4Yjc1MjdiZjgsIDB4MjNhYjczZDMsIDB4ZTI3MjRiMDIsIDB4NTdlMzFmOGYsIDB4MmE2NjU1YWIsIDB4MDdiMmViMjgsIDB4MDMyZmI1YzIsIDB4OWE4NmM1N2IsIDB4YTVkMzM3MDgsIDB4ZjIzMDI4ODcsIDB4YjIyM2JmYTUsIDB4YmEwMjAzNmEsIDB4NWNlZDE2ODIsIDB4MmI4YWNmMWMsIDB4OTJhNzc5YjQsIDB4ZjBmMzA3ZjIsIDB4YTE0ZTY5ZTIsIDB4Y2Q2NWRhZjQsIDB4ZDUwNjA1YmUsIDB4MWZkMTM0NjIsIDB4OGFjNGE2ZmUsIDB4OWQzNDJlNTMsIDB4YTBhMmYzNTUsIDB4MzIwNThhZTEsIDB4NzVhNGY2ZWIsIDB4MzkwYjgzZWMsIDB4YWE0MDYwZWYsIDB4MDY1ZTcxOWYsIDB4NTFiZDZlMTAsIDB4ZjkzZTIxOGEsIDB4M2Q5NmRkMDYsIDB4YWVkZDNlMDUsIDB4NDY0ZGU2YmQsIDB4YjU5MTU0OGQsIDB4MDU3MWM0NWQsIDB4NmYwNDA2ZDQsIDB4ZmY2MDUwMTUsIDB4MjQxOTk4ZmIsIDB4OTdkNmJkZTksIDB4Y2M4OTQwNDMsIDB4Nzc2N2Q5OWUsIDB4YmRiMGU4NDIsIDB4ODgwNzg5OGIsIDB4MzhlNzE5NWIsIDB4ZGI3OWM4ZWUsIDB4NDdhMTdjMGEsIDB4ZTk3YzQyMGYsIDB4YzlmODg0MWUsIDB4MDAwMDAwMDAsIDB4ODMwOTgwODYsIDB4NDgzMjJiZWQsIDB4YWMxZTExNzAsIDB4NGU2YzVhNzIsIDB4ZmJmZDBlZmYsIDB4NTYwZjg1MzgsIDB4MWUzZGFlZDUsIDB4MjczNjJkMzksIDB4NjQwYTBmZDksIDB4MjE2ODVjYTYsIDB4ZDE5YjViNTQsIDB4M2EyNDM2MmUsIDB4YjEwYzBhNjcsIDB4MGY5MzU3ZTcsIDB4ZDJiNGVlOTYsIDB4OWUxYjliOTEsIDB4NGY4MGMwYzUsIDB4YTI2MWRjMjAsIDB4Njk1YTc3NGIsIDB4MTYxYzEyMWEsIDB4MGFlMjkzYmEsIDB4ZTVjMGEwMmEsIDB4NDMzYzIyZTAsIDB4MWQxMjFiMTcsIDB4MGIwZTA5MGQsIDB4YWRmMjhiYzcsIDB4YjkyZGI2YTgsIDB4YzgxNDFlYTksIDB4ODU1N2YxMTksIDB4NGNhZjc1MDcsIDB4YmJlZTk5ZGQsIDB4ZmRhMzdmNjAsIDB4OWZmNzAxMjYsIDB4YmM1YzcyZjUsIDB4YzU0NDY2M2IsIDB4MzQ1YmZiN2UsIDB4NzY4YjQzMjksIDB4ZGNjYjIzYzYsIDB4NjhiNmVkZmMsIDB4NjNiOGU0ZjEsIDB4Y2FkNzMxZGMsIDB4MTA0MjYzODUsIDB4NDAxMzk3MjIsIDB4MjA4NGM2MTEsIDB4N2Q4NTRhMjQsIDB4ZjhkMmJiM2QsIDB4MTFhZWY5MzIsIDB4NmRjNzI5YTEsIDB4NGIxZDllMmYsIDB4ZjNkY2IyMzAsIDB4ZWMwZDg2NTIsIDB4ZDA3N2MxZTMsIDB4NmMyYmIzMTYsIDB4OTlhOTcwYjksIDB4ZmExMTk0NDgsIDB4MjI0N2U5NjQsIDB4YzRhOGZjOGMsIDB4MWFhMGYwM2YsIDB4ZDg1NjdkMmMsIDB4ZWYyMjMzOTAsIDB4Yzc4NzQ5NGUsIDB4YzFkOTM4ZDEsIDB4ZmU4Y2NhYTIsIDB4MzY5OGQ0MGIsIDB4Y2ZhNmY1ODEsIDB4MjhhNTdhZGUsIDB4MjZkYWI3OGUsIDB4YTQzZmFkYmYsIDB4ZTQyYzNhOWQsIDB4MGQ1MDc4OTIsIDB4OWI2YTVmY2MsIDB4NjI1NDdlNDYsIDB4YzJmNjhkMTMsIDB4ZTg5MGQ4YjgsIDB4NWUyZTM5ZjcsIDB4ZjU4MmMzYWYsIDB4YmU5ZjVkODAsIDB4N2M2OWQwOTMsIDB4YTk2ZmQ1MmQsIDB4YjNjZjI1MTIsIDB4M2JjOGFjOTksIDB4YTcxMDE4N2QsIDB4NmVlODljNjMsIDB4N2JkYjNiYmIsIDB4MDljZDI2NzgsIDB4ZjQ2ZTU5MTgsIDB4MDFlYzlhYjcsIDB4YTg4MzRmOWEsIDB4NjVlNjk1NmUsIDB4N2VhYWZmZTYsIDB4MDgyMWJjY2YsIDB4ZTZlZjE1ZTgsIDB4ZDliYWU3OWIsIDB4Y2U0YTZmMzYsIDB4ZDRlYTlmMDksIDB4ZDYyOWIwN2MsIDB4YWYzMWE0YjIsIDB4MzEyYTNmMjMsIDB4MzBjNmE1OTQsIDB4YzAzNWEyNjYsIDB4Mzc3NDRlYmMsIDB4YTZmYzgyY2EsIDB4YjBlMDkwZDAsIDB4MTUzM2E3ZDgsIDB4NGFmMTA0OTgsIDB4Zjc0MWVjZGEsIDB4MGU3ZmNkNTAsIDB4MmYxNzkxZjYsIDB4OGQ3NjRkZDYsIDB4NGQ0M2VmYjAsIDB4NTRjY2FhNGQsIDB4ZGZlNDk2MDQsIDB4ZTM5ZWQxYjUsIDB4MWI0YzZhODgsIDB4YjhjMTJjMWYsIDB4N2Y0NjY1NTEsIDB4MDQ5ZDVlZWEsIDB4NWQwMThjMzUsIDB4NzNmYTg3NzQsIDB4MmVmYjBiNDEsIDB4NWFiMzY3MWQsIDB4NTI5MmRiZDIsIDB4MzNlOTEwNTYsIDB4MTM2ZGQ2NDcsIDB4OGM5YWQ3NjEsIDB4N2EzN2ExMGMsIDB4OGU1OWY4MTQsIDB4ODllYjEzM2MsIDB4ZWVjZWE5MjcsIDB4MzViNzYxYzksIDB4ZWRlMTFjZTUsIDB4M2M3YTQ3YjEsIDB4NTk5Y2QyZGYsIDB4M2Y1NWYyNzMsIDB4NzkxODE0Y2UsIDB4YmY3M2M3MzcsIDB4ZWE1M2Y3Y2QsIDB4NWI1ZmZkYWEsIDB4MTRkZjNkNmYsIDB4ODY3ODQ0ZGIsIDB4ODFjYWFmZjMsIDB4M2ViOTY4YzQsIDB4MmMzODI0MzQsIDB4NWZjMmEzNDAsIDB4NzIxNjFkYzMsIDB4MGNiY2UyMjUsIDB4OGIyODNjNDksIDB4NDFmZjBkOTUsIDB4NzEzOWE4MDEsIDB4ZGUwODBjYjMsIDB4OWNkOGI0ZTQsIDB4OTA2NDU2YzEsIDB4NjE3YmNiODQsIDB4NzBkNTMyYjYsIDB4NzQ0ODZjNWMsIDB4NDJkMGI4NTddO1xuICAgIHZhciBUNyA9IFsweGE3NTA1MWY0LCAweDY1NTM3ZTQxLCAweGE0YzMxYTE3LCAweDVlOTYzYTI3LCAweDZiY2IzYmFiLCAweDQ1ZjExZjlkLCAweDU4YWJhY2ZhLCAweDAzOTM0YmUzLCAweGZhNTUyMDMwLCAweDZkZjZhZDc2LCAweDc2OTE4OGNjLCAweDRjMjVmNTAyLCAweGQ3ZmM0ZmU1LCAweGNiZDdjNTJhLCAweDQ0ODAyNjM1LCAweGEzOGZiNTYyLCAweDVhNDlkZWIxLCAweDFiNjcyNWJhLCAweDBlOTg0NWVhLCAweGMwZTE1ZGZlLCAweDc1MDJjMzJmLCAweGYwMTI4MTRjLCAweDk3YTM4ZDQ2LCAweGY5YzY2YmQzLCAweDVmZTcwMzhmLCAweDljOTUxNTkyLCAweDdhZWJiZjZkLCAweDU5ZGE5NTUyLCAweDgzMmRkNGJlLCAweDIxZDM1ODc0LCAweDY5Mjk0OWUwLCAweGM4NDQ4ZWM5LCAweDg5NmE3NWMyLCAweDc5NzhmNDhlLCAweDNlNmI5OTU4LCAweDcxZGQyN2I5LCAweDRmYjZiZWUxLCAweGFkMTdmMDg4LCAweGFjNjZjOTIwLCAweDNhYjQ3ZGNlLCAweDRhMTg2M2RmLCAweDMxODJlNTFhLCAweDMzNjA5NzUxLCAweDdmNDU2MjUzLCAweDc3ZTBiMTY0LCAweGFlODRiYjZiLCAweGEwMWNmZTgxLCAweDJiOTRmOTA4LCAweDY4NTg3MDQ4LCAweGZkMTk4ZjQ1LCAweDZjODc5NGRlLCAweGY4Yjc1MjdiLCAweGQzMjNhYjczLCAweDAyZTI3MjRiLCAweDhmNTdlMzFmLCAweGFiMmE2NjU1LCAweDI4MDdiMmViLCAweGMyMDMyZmI1LCAweDdiOWE4NmM1LCAweDA4YTVkMzM3LCAweDg3ZjIzMDI4LCAweGE1YjIyM2JmLCAweDZhYmEwMjAzLCAweDgyNWNlZDE2LCAweDFjMmI4YWNmLCAweGI0OTJhNzc5LCAweGYyZjBmMzA3LCAweGUyYTE0ZTY5LCAweGY0Y2Q2NWRhLCAweGJlZDUwNjA1LCAweDYyMWZkMTM0LCAweGZlOGFjNGE2LCAweDUzOWQzNDJlLCAweDU1YTBhMmYzLCAweGUxMzIwNThhLCAweGViNzVhNGY2LCAweGVjMzkwYjgzLCAweGVmYWE0MDYwLCAweDlmMDY1ZTcxLCAweDEwNTFiZDZlLCAweDhhZjkzZTIxLCAweDA2M2Q5NmRkLCAweDA1YWVkZDNlLCAweGJkNDY0ZGU2LCAweDhkYjU5MTU0LCAweDVkMDU3MWM0LCAweGQ0NmYwNDA2LCAweDE1ZmY2MDUwLCAweGZiMjQxOTk4LCAweGU5OTdkNmJkLCAweDQzY2M4OTQwLCAweDllNzc2N2Q5LCAweDQyYmRiMGU4LCAweDhiODgwNzg5LCAweDViMzhlNzE5LCAweGVlZGI3OWM4LCAweDBhNDdhMTdjLCAweDBmZTk3YzQyLCAweDFlYzlmODg0LCAweDAwMDAwMDAwLCAweDg2ODMwOTgwLCAweGVkNDgzMjJiLCAweDcwYWMxZTExLCAweDcyNGU2YzVhLCAweGZmZmJmZDBlLCAweDM4NTYwZjg1LCAweGQ1MWUzZGFlLCAweDM5MjczNjJkLCAweGQ5NjQwYTBmLCAweGE2MjE2ODVjLCAweDU0ZDE5YjViLCAweDJlM2EyNDM2LCAweDY3YjEwYzBhLCAweGU3MGY5MzU3LCAweDk2ZDJiNGVlLCAweDkxOWUxYjliLCAweGM1NGY4MGMwLCAweDIwYTI2MWRjLCAweDRiNjk1YTc3LCAweDFhMTYxYzEyLCAweGJhMGFlMjkzLCAweDJhZTVjMGEwLCAweGUwNDMzYzIyLCAweDE3MWQxMjFiLCAweDBkMGIwZTA5LCAweGM3YWRmMjhiLCAweGE4YjkyZGI2LCAweGE5YzgxNDFlLCAweDE5ODU1N2YxLCAweDA3NGNhZjc1LCAweGRkYmJlZTk5LCAweDYwZmRhMzdmLCAweDI2OWZmNzAxLCAweGY1YmM1YzcyLCAweDNiYzU0NDY2LCAweDdlMzQ1YmZiLCAweDI5NzY4YjQzLCAweGM2ZGNjYjIzLCAweGZjNjhiNmVkLCAweGYxNjNiOGU0LCAweGRjY2FkNzMxLCAweDg1MTA0MjYzLCAweDIyNDAxMzk3LCAweDExMjA4NGM2LCAweDI0N2Q4NTRhLCAweDNkZjhkMmJiLCAweDMyMTFhZWY5LCAweGExNmRjNzI5LCAweDJmNGIxZDllLCAweDMwZjNkY2IyLCAweDUyZWMwZDg2LCAweGUzZDA3N2MxLCAweDE2NmMyYmIzLCAweGI5OTlhOTcwLCAweDQ4ZmExMTk0LCAweDY0MjI0N2U5LCAweDhjYzRhOGZjLCAweDNmMWFhMGYwLCAweDJjZDg1NjdkLCAweDkwZWYyMjMzLCAweDRlYzc4NzQ5LCAweGQxYzFkOTM4LCAweGEyZmU4Y2NhLCAweDBiMzY5OGQ0LCAweDgxY2ZhNmY1LCAweGRlMjhhNTdhLCAweDhlMjZkYWI3LCAweGJmYTQzZmFkLCAweDlkZTQyYzNhLCAweDkyMGQ1MDc4LCAweGNjOWI2YTVmLCAweDQ2NjI1NDdlLCAweDEzYzJmNjhkLCAweGI4ZTg5MGQ4LCAweGY3NWUyZTM5LCAweGFmZjU4MmMzLCAweDgwYmU5ZjVkLCAweDkzN2M2OWQwLCAweDJkYTk2ZmQ1LCAweDEyYjNjZjI1LCAweDk5M2JjOGFjLCAweDdkYTcxMDE4LCAweDYzNmVlODljLCAweGJiN2JkYjNiLCAweDc4MDljZDI2LCAweDE4ZjQ2ZTU5LCAweGI3MDFlYzlhLCAweDlhYTg4MzRmLCAweDZlNjVlNjk1LCAweGU2N2VhYWZmLCAweGNmMDgyMWJjLCAweGU4ZTZlZjE1LCAweDliZDliYWU3LCAweDM2Y2U0YTZmLCAweDA5ZDRlYTlmLCAweDdjZDYyOWIwLCAweGIyYWYzMWE0LCAweDIzMzEyYTNmLCAweDk0MzBjNmE1LCAweDY2YzAzNWEyLCAweGJjMzc3NDRlLCAweGNhYTZmYzgyLCAweGQwYjBlMDkwLCAweGQ4MTUzM2E3LCAweDk4NGFmMTA0LCAweGRhZjc0MWVjLCAweDUwMGU3ZmNkLCAweGY2MmYxNzkxLCAweGQ2OGQ3NjRkLCAweGIwNGQ0M2VmLCAweDRkNTRjY2FhLCAweDA0ZGZlNDk2LCAweGI1ZTM5ZWQxLCAweDg4MWI0YzZhLCAweDFmYjhjMTJjLCAweDUxN2Y0NjY1LCAweGVhMDQ5ZDVlLCAweDM1NWQwMThjLCAweDc0NzNmYTg3LCAweDQxMmVmYjBiLCAweDFkNWFiMzY3LCAweGQyNTI5MmRiLCAweDU2MzNlOTEwLCAweDQ3MTM2ZGQ2LCAweDYxOGM5YWQ3LCAweDBjN2EzN2ExLCAweDE0OGU1OWY4LCAweDNjODllYjEzLCAweDI3ZWVjZWE5LCAweGM5MzViNzYxLCAweGU1ZWRlMTFjLCAweGIxM2M3YTQ3LCAweGRmNTk5Y2QyLCAweDczM2Y1NWYyLCAweGNlNzkxODE0LCAweDM3YmY3M2M3LCAweGNkZWE1M2Y3LCAweGFhNWI1ZmZkLCAweDZmMTRkZjNkLCAweGRiODY3ODQ0LCAweGYzODFjYWFmLCAweGM0M2ViOTY4LCAweDM0MmMzODI0LCAweDQwNWZjMmEzLCAweGMzNzIxNjFkLCAweDI1MGNiY2UyLCAweDQ5OGIyODNjLCAweDk1NDFmZjBkLCAweDAxNzEzOWE4LCAweGIzZGUwODBjLCAweGU0OWNkOGI0LCAweGMxOTA2NDU2LCAweDg0NjE3YmNiLCAweGI2NzBkNTMyLCAweDVjNzQ0ODZjLCAweDU3NDJkMGI4XTtcbiAgICB2YXIgVDggPSBbMHhmNGE3NTA1MSwgMHg0MTY1NTM3ZSwgMHgxN2E0YzMxYSwgMHgyNzVlOTYzYSwgMHhhYjZiY2IzYiwgMHg5ZDQ1ZjExZiwgMHhmYTU4YWJhYywgMHhlMzAzOTM0YiwgMHgzMGZhNTUyMCwgMHg3NjZkZjZhZCwgMHhjYzc2OTE4OCwgMHgwMjRjMjVmNSwgMHhlNWQ3ZmM0ZiwgMHgyYWNiZDdjNSwgMHgzNTQ0ODAyNiwgMHg2MmEzOGZiNSwgMHhiMTVhNDlkZSwgMHhiYTFiNjcyNSwgMHhlYTBlOTg0NSwgMHhmZWMwZTE1ZCwgMHgyZjc1MDJjMywgMHg0Y2YwMTI4MSwgMHg0Njk3YTM4ZCwgMHhkM2Y5YzY2YiwgMHg4ZjVmZTcwMywgMHg5MjljOTUxNSwgMHg2ZDdhZWJiZiwgMHg1MjU5ZGE5NSwgMHhiZTgzMmRkNCwgMHg3NDIxZDM1OCwgMHhlMDY5Mjk0OSwgMHhjOWM4NDQ4ZSwgMHhjMjg5NmE3NSwgMHg4ZTc5NzhmNCwgMHg1ODNlNmI5OSwgMHhiOTcxZGQyNywgMHhlMTRmYjZiZSwgMHg4OGFkMTdmMCwgMHgyMGFjNjZjOSwgMHhjZTNhYjQ3ZCwgMHhkZjRhMTg2MywgMHgxYTMxODJlNSwgMHg1MTMzNjA5NywgMHg1MzdmNDU2MiwgMHg2NDc3ZTBiMSwgMHg2YmFlODRiYiwgMHg4MWEwMWNmZSwgMHgwODJiOTRmOSwgMHg0ODY4NTg3MCwgMHg0NWZkMTk4ZiwgMHhkZTZjODc5NCwgMHg3YmY4Yjc1MiwgMHg3M2QzMjNhYiwgMHg0YjAyZTI3MiwgMHgxZjhmNTdlMywgMHg1NWFiMmE2NiwgMHhlYjI4MDdiMiwgMHhiNWMyMDMyZiwgMHhjNTdiOWE4NiwgMHgzNzA4YTVkMywgMHgyODg3ZjIzMCwgMHhiZmE1YjIyMywgMHgwMzZhYmEwMiwgMHgxNjgyNWNlZCwgMHhjZjFjMmI4YSwgMHg3OWI0OTJhNywgMHgwN2YyZjBmMywgMHg2OWUyYTE0ZSwgMHhkYWY0Y2Q2NSwgMHgwNWJlZDUwNiwgMHgzNDYyMWZkMSwgMHhhNmZlOGFjNCwgMHgyZTUzOWQzNCwgMHhmMzU1YTBhMiwgMHg4YWUxMzIwNSwgMHhmNmViNzVhNCwgMHg4M2VjMzkwYiwgMHg2MGVmYWE0MCwgMHg3MTlmMDY1ZSwgMHg2ZTEwNTFiZCwgMHgyMThhZjkzZSwgMHhkZDA2M2Q5NiwgMHgzZTA1YWVkZCwgMHhlNmJkNDY0ZCwgMHg1NDhkYjU5MSwgMHhjNDVkMDU3MSwgMHgwNmQ0NmYwNCwgMHg1MDE1ZmY2MCwgMHg5OGZiMjQxOSwgMHhiZGU5OTdkNiwgMHg0MDQzY2M4OSwgMHhkOTllNzc2NywgMHhlODQyYmRiMCwgMHg4OThiODgwNywgMHgxOTViMzhlNywgMHhjOGVlZGI3OSwgMHg3YzBhNDdhMSwgMHg0MjBmZTk3YywgMHg4NDFlYzlmOCwgMHgwMDAwMDAwMCwgMHg4MDg2ODMwOSwgMHgyYmVkNDgzMiwgMHgxMTcwYWMxZSwgMHg1YTcyNGU2YywgMHgwZWZmZmJmZCwgMHg4NTM4NTYwZiwgMHhhZWQ1MWUzZCwgMHgyZDM5MjczNiwgMHgwZmQ5NjQwYSwgMHg1Y2E2MjE2OCwgMHg1YjU0ZDE5YiwgMHgzNjJlM2EyNCwgMHgwYTY3YjEwYywgMHg1N2U3MGY5MywgMHhlZTk2ZDJiNCwgMHg5YjkxOWUxYiwgMHhjMGM1NGY4MCwgMHhkYzIwYTI2MSwgMHg3NzRiNjk1YSwgMHgxMjFhMTYxYywgMHg5M2JhMGFlMiwgMHhhMDJhZTVjMCwgMHgyMmUwNDMzYywgMHgxYjE3MWQxMiwgMHgwOTBkMGIwZSwgMHg4YmM3YWRmMiwgMHhiNmE4YjkyZCwgMHgxZWE5YzgxNCwgMHhmMTE5ODU1NywgMHg3NTA3NGNhZiwgMHg5OWRkYmJlZSwgMHg3ZjYwZmRhMywgMHgwMTI2OWZmNywgMHg3MmY1YmM1YywgMHg2NjNiYzU0NCwgMHhmYjdlMzQ1YiwgMHg0MzI5NzY4YiwgMHgyM2M2ZGNjYiwgMHhlZGZjNjhiNiwgMHhlNGYxNjNiOCwgMHgzMWRjY2FkNywgMHg2Mzg1MTA0MiwgMHg5NzIyNDAxMywgMHhjNjExMjA4NCwgMHg0YTI0N2Q4NSwgMHhiYjNkZjhkMiwgMHhmOTMyMTFhZSwgMHgyOWExNmRjNywgMHg5ZTJmNGIxZCwgMHhiMjMwZjNkYywgMHg4NjUyZWMwZCwgMHhjMWUzZDA3NywgMHhiMzE2NmMyYiwgMHg3MGI5OTlhOSwgMHg5NDQ4ZmExMSwgMHhlOTY0MjI0NywgMHhmYzhjYzRhOCwgMHhmMDNmMWFhMCwgMHg3ZDJjZDg1NiwgMHgzMzkwZWYyMiwgMHg0OTRlYzc4NywgMHgzOGQxYzFkOSwgMHhjYWEyZmU4YywgMHhkNDBiMzY5OCwgMHhmNTgxY2ZhNiwgMHg3YWRlMjhhNSwgMHhiNzhlMjZkYSwgMHhhZGJmYTQzZiwgMHgzYTlkZTQyYywgMHg3ODkyMGQ1MCwgMHg1ZmNjOWI2YSwgMHg3ZTQ2NjI1NCwgMHg4ZDEzYzJmNiwgMHhkOGI4ZTg5MCwgMHgzOWY3NWUyZSwgMHhjM2FmZjU4MiwgMHg1ZDgwYmU5ZiwgMHhkMDkzN2M2OSwgMHhkNTJkYTk2ZiwgMHgyNTEyYjNjZiwgMHhhYzk5M2JjOCwgMHgxODdkYTcxMCwgMHg5YzYzNmVlOCwgMHgzYmJiN2JkYiwgMHgyNjc4MDljZCwgMHg1OTE4ZjQ2ZSwgMHg5YWI3MDFlYywgMHg0ZjlhYTg4MywgMHg5NTZlNjVlNiwgMHhmZmU2N2VhYSwgMHhiY2NmMDgyMSwgMHgxNWU4ZTZlZiwgMHhlNzliZDliYSwgMHg2ZjM2Y2U0YSwgMHg5ZjA5ZDRlYSwgMHhiMDdjZDYyOSwgMHhhNGIyYWYzMSwgMHgzZjIzMzEyYSwgMHhhNTk0MzBjNiwgMHhhMjY2YzAzNSwgMHg0ZWJjMzc3NCwgMHg4MmNhYTZmYywgMHg5MGQwYjBlMCwgMHhhN2Q4MTUzMywgMHgwNDk4NGFmMSwgMHhlY2RhZjc0MSwgMHhjZDUwMGU3ZiwgMHg5MWY2MmYxNywgMHg0ZGQ2OGQ3NiwgMHhlZmIwNGQ0MywgMHhhYTRkNTRjYywgMHg5NjA0ZGZlNCwgMHhkMWI1ZTM5ZSwgMHg2YTg4MWI0YywgMHgyYzFmYjhjMSwgMHg2NTUxN2Y0NiwgMHg1ZWVhMDQ5ZCwgMHg4YzM1NWQwMSwgMHg4Nzc0NzNmYSwgMHgwYjQxMmVmYiwgMHg2NzFkNWFiMywgMHhkYmQyNTI5MiwgMHgxMDU2MzNlOSwgMHhkNjQ3MTM2ZCwgMHhkNzYxOGM5YSwgMHhhMTBjN2EzNywgMHhmODE0OGU1OSwgMHgxMzNjODllYiwgMHhhOTI3ZWVjZSwgMHg2MWM5MzViNywgMHgxY2U1ZWRlMSwgMHg0N2IxM2M3YSwgMHhkMmRmNTk5YywgMHhmMjczM2Y1NSwgMHgxNGNlNzkxOCwgMHhjNzM3YmY3MywgMHhmN2NkZWE1MywgMHhmZGFhNWI1ZiwgMHgzZDZmMTRkZiwgMHg0NGRiODY3OCwgMHhhZmYzODFjYSwgMHg2OGM0M2ViOSwgMHgyNDM0MmMzOCwgMHhhMzQwNWZjMiwgMHgxZGMzNzIxNiwgMHhlMjI1MGNiYywgMHgzYzQ5OGIyOCwgMHgwZDk1NDFmZiwgMHhhODAxNzEzOSwgMHgwY2IzZGUwOCwgMHhiNGU0OWNkOCwgMHg1NmMxOTA2NCwgMHhjYjg0NjE3YiwgMHgzMmI2NzBkNSwgMHg2YzVjNzQ0OCwgMHhiODU3NDJkMF07XG5cbiAgICAvLyBUcmFuc2Zvcm1hdGlvbnMgZm9yIGRlY3J5cHRpb24ga2V5IGV4cGFuc2lvblxuICAgIHZhciBVMSA9IFsweDAwMDAwMDAwLCAweDBlMDkwZDBiLCAweDFjMTIxYTE2LCAweDEyMWIxNzFkLCAweDM4MjQzNDJjLCAweDM2MmQzOTI3LCAweDI0MzYyZTNhLCAweDJhM2YyMzMxLCAweDcwNDg2ODU4LCAweDdlNDE2NTUzLCAweDZjNWE3MjRlLCAweDYyNTM3ZjQ1LCAweDQ4NmM1Yzc0LCAweDQ2NjU1MTdmLCAweDU0N2U0NjYyLCAweDVhNzc0YjY5LCAweGUwOTBkMGIwLCAweGVlOTlkZGJiLCAweGZjODJjYWE2LCAweGYyOGJjN2FkLCAweGQ4YjRlNDljLCAweGQ2YmRlOTk3LCAweGM0YTZmZThhLCAweGNhYWZmMzgxLCAweDkwZDhiOGU4LCAweDllZDFiNWUzLCAweDhjY2FhMmZlLCAweDgyYzNhZmY1LCAweGE4ZmM4Y2M0LCAweGE2ZjU4MWNmLCAweGI0ZWU5NmQyLCAweGJhZTc5YmQ5LCAweGRiM2JiYjdiLCAweGQ1MzJiNjcwLCAweGM3MjlhMTZkLCAweGM5MjBhYzY2LCAweGUzMWY4ZjU3LCAweGVkMTY4MjVjLCAweGZmMGQ5NTQxLCAweGYxMDQ5ODRhLCAweGFiNzNkMzIzLCAweGE1N2FkZTI4LCAweGI3NjFjOTM1LCAweGI5NjhjNDNlLCAweDkzNTdlNzBmLCAweDlkNWVlYTA0LCAweDhmNDVmZDE5LCAweDgxNGNmMDEyLCAweDNiYWI2YmNiLCAweDM1YTI2NmMwLCAweDI3Yjk3MWRkLCAweDI5YjA3Y2Q2LCAweDAzOGY1ZmU3LCAweDBkODY1MmVjLCAweDFmOWQ0NWYxLCAweDExOTQ0OGZhLCAweDRiZTMwMzkzLCAweDQ1ZWEwZTk4LCAweDU3ZjExOTg1LCAweDU5ZjgxNDhlLCAweDczYzczN2JmLCAweDdkY2UzYWI0LCAweDZmZDUyZGE5LCAweDYxZGMyMGEyLCAweGFkNzY2ZGY2LCAweGEzN2Y2MGZkLCAweGIxNjQ3N2UwLCAweGJmNmQ3YWViLCAweDk1NTI1OWRhLCAweDliNWI1NGQxLCAweDg5NDA0M2NjLCAweDg3NDk0ZWM3LCAweGRkM2UwNWFlLCAweGQzMzcwOGE1LCAweGMxMmMxZmI4LCAweGNmMjUxMmIzLCAweGU1MWEzMTgyLCAweGViMTMzYzg5LCAweGY5MDgyYjk0LCAweGY3MDEyNjlmLCAweDRkZTZiZDQ2LCAweDQzZWZiMDRkLCAweDUxZjRhNzUwLCAweDVmZmRhYTViLCAweDc1YzI4OTZhLCAweDdiY2I4NDYxLCAweDY5ZDA5MzdjLCAweDY3ZDk5ZTc3LCAweDNkYWVkNTFlLCAweDMzYTdkODE1LCAweDIxYmNjZjA4LCAweDJmYjVjMjAzLCAweDA1OGFlMTMyLCAweDBiODNlYzM5LCAweDE5OThmYjI0LCAweDE3OTFmNjJmLCAweDc2NGRkNjhkLCAweDc4NDRkYjg2LCAweDZhNWZjYzliLCAweDY0NTZjMTkwLCAweDRlNjllMmExLCAweDQwNjBlZmFhLCAweDUyN2JmOGI3LCAweDVjNzJmNWJjLCAweDA2MDViZWQ1LCAweDA4MGNiM2RlLCAweDFhMTdhNGMzLCAweDE0MWVhOWM4LCAweDNlMjE4YWY5LCAweDMwMjg4N2YyLCAweDIyMzM5MGVmLCAweDJjM2E5ZGU0LCAweDk2ZGQwNjNkLCAweDk4ZDQwYjM2LCAweDhhY2YxYzJiLCAweDg0YzYxMTIwLCAweGFlZjkzMjExLCAweGEwZjAzZjFhLCAweGIyZWIyODA3LCAweGJjZTIyNTBjLCAweGU2OTU2ZTY1LCAweGU4OWM2MzZlLCAweGZhODc3NDczLCAweGY0OGU3OTc4LCAweGRlYjE1YTQ5LCAweGQwYjg1NzQyLCAweGMyYTM0MDVmLCAweGNjYWE0ZDU0LCAweDQxZWNkYWY3LCAweDRmZTVkN2ZjLCAweDVkZmVjMGUxLCAweDUzZjdjZGVhLCAweDc5YzhlZWRiLCAweDc3YzFlM2QwLCAweDY1ZGFmNGNkLCAweDZiZDNmOWM2LCAweDMxYTRiMmFmLCAweDNmYWRiZmE0LCAweDJkYjZhOGI5LCAweDIzYmZhNWIyLCAweDA5ODA4NjgzLCAweDA3ODk4Yjg4LCAweDE1OTI5Yzk1LCAweDFiOWI5MTllLCAweGExN2MwYTQ3LCAweGFmNzUwNzRjLCAweGJkNmUxMDUxLCAweGIzNjcxZDVhLCAweDk5NTgzZTZiLCAweDk3NTEzMzYwLCAweDg1NGEyNDdkLCAweDhiNDMyOTc2LCAweGQxMzQ2MjFmLCAweGRmM2Q2ZjE0LCAweGNkMjY3ODA5LCAweGMzMmY3NTAyLCAweGU5MTA1NjMzLCAweGU3MTk1YjM4LCAweGY1MDI0YzI1LCAweGZiMGI0MTJlLCAweDlhZDc2MThjLCAweDk0ZGU2Yzg3LCAweDg2YzU3YjlhLCAweDg4Y2M3NjkxLCAweGEyZjM1NWEwLCAweGFjZmE1OGFiLCAweGJlZTE0ZmI2LCAweGIwZTg0MmJkLCAweGVhOWYwOWQ0LCAweGU0OTYwNGRmLCAweGY2OGQxM2MyLCAweGY4ODQxZWM5LCAweGQyYmIzZGY4LCAweGRjYjIzMGYzLCAweGNlYTkyN2VlLCAweGMwYTAyYWU1LCAweDdhNDdiMTNjLCAweDc0NGViYzM3LCAweDY2NTVhYjJhLCAweDY4NWNhNjIxLCAweDQyNjM4NTEwLCAweDRjNmE4ODFiLCAweDVlNzE5ZjA2LCAweDUwNzg5MjBkLCAweDBhMGZkOTY0LCAweDA0MDZkNDZmLCAweDE2MWRjMzcyLCAweDE4MTRjZTc5LCAweDMyMmJlZDQ4LCAweDNjMjJlMDQzLCAweDJlMzlmNzVlLCAweDIwMzBmYTU1LCAweGVjOWFiNzAxLCAweGUyOTNiYTBhLCAweGYwODhhZDE3LCAweGZlODFhMDFjLCAweGQ0YmU4MzJkLCAweGRhYjc4ZTI2LCAweGM4YWM5OTNiLCAweGM2YTU5NDMwLCAweDljZDJkZjU5LCAweDkyZGJkMjUyLCAweDgwYzBjNTRmLCAweDhlYzljODQ0LCAweGE0ZjZlYjc1LCAweGFhZmZlNjdlLCAweGI4ZTRmMTYzLCAweGI2ZWRmYzY4LCAweDBjMGE2N2IxLCAweDAyMDM2YWJhLCAweDEwMTg3ZGE3LCAweDFlMTE3MGFjLCAweDM0MmU1MzlkLCAweDNhMjc1ZTk2LCAweDI4M2M0OThiLCAweDI2MzU0NDgwLCAweDdjNDIwZmU5LCAweDcyNGIwMmUyLCAweDYwNTAxNWZmLCAweDZlNTkxOGY0LCAweDQ0NjYzYmM1LCAweDRhNmYzNmNlLCAweDU4NzQyMWQzLCAweDU2N2QyY2Q4LCAweDM3YTEwYzdhLCAweDM5YTgwMTcxLCAweDJiYjMxNjZjLCAweDI1YmExYjY3LCAweDBmODUzODU2LCAweDAxOGMzNTVkLCAweDEzOTcyMjQwLCAweDFkOWUyZjRiLCAweDQ3ZTk2NDIyLCAweDQ5ZTA2OTI5LCAweDViZmI3ZTM0LCAweDU1ZjI3MzNmLCAweDdmY2Q1MDBlLCAweDcxYzQ1ZDA1LCAweDYzZGY0YTE4LCAweDZkZDY0NzEzLCAweGQ3MzFkY2NhLCAweGQ5MzhkMWMxLCAweGNiMjNjNmRjLCAweGM1MmFjYmQ3LCAweGVmMTVlOGU2LCAweGUxMWNlNWVkLCAweGYzMDdmMmYwLCAweGZkMGVmZmZiLCAweGE3NzliNDkyLCAweGE5NzBiOTk5LCAweGJiNmJhZTg0LCAweGI1NjJhMzhmLCAweDlmNWQ4MGJlLCAweDkxNTQ4ZGI1LCAweDgzNGY5YWE4LCAweDhkNDY5N2EzXTtcbiAgICB2YXIgVTIgPSBbMHgwMDAwMDAwMCwgMHgwYjBlMDkwZCwgMHgxNjFjMTIxYSwgMHgxZDEyMWIxNywgMHgyYzM4MjQzNCwgMHgyNzM2MmQzOSwgMHgzYTI0MzYyZSwgMHgzMTJhM2YyMywgMHg1ODcwNDg2OCwgMHg1MzdlNDE2NSwgMHg0ZTZjNWE3MiwgMHg0NTYyNTM3ZiwgMHg3NDQ4NmM1YywgMHg3ZjQ2NjU1MSwgMHg2MjU0N2U0NiwgMHg2OTVhNzc0YiwgMHhiMGUwOTBkMCwgMHhiYmVlOTlkZCwgMHhhNmZjODJjYSwgMHhhZGYyOGJjNywgMHg5Y2Q4YjRlNCwgMHg5N2Q2YmRlOSwgMHg4YWM0YTZmZSwgMHg4MWNhYWZmMywgMHhlODkwZDhiOCwgMHhlMzllZDFiNSwgMHhmZThjY2FhMiwgMHhmNTgyYzNhZiwgMHhjNGE4ZmM4YywgMHhjZmE2ZjU4MSwgMHhkMmI0ZWU5NiwgMHhkOWJhZTc5YiwgMHg3YmRiM2JiYiwgMHg3MGQ1MzJiNiwgMHg2ZGM3MjlhMSwgMHg2NmM5MjBhYywgMHg1N2UzMWY4ZiwgMHg1Y2VkMTY4MiwgMHg0MWZmMGQ5NSwgMHg0YWYxMDQ5OCwgMHgyM2FiNzNkMywgMHgyOGE1N2FkZSwgMHgzNWI3NjFjOSwgMHgzZWI5NjhjNCwgMHgwZjkzNTdlNywgMHgwNDlkNWVlYSwgMHgxOThmNDVmZCwgMHgxMjgxNGNmMCwgMHhjYjNiYWI2YiwgMHhjMDM1YTI2NiwgMHhkZDI3Yjk3MSwgMHhkNjI5YjA3YywgMHhlNzAzOGY1ZiwgMHhlYzBkODY1MiwgMHhmMTFmOWQ0NSwgMHhmYTExOTQ0OCwgMHg5MzRiZTMwMywgMHg5ODQ1ZWEwZSwgMHg4NTU3ZjExOSwgMHg4ZTU5ZjgxNCwgMHhiZjczYzczNywgMHhiNDdkY2UzYSwgMHhhOTZmZDUyZCwgMHhhMjYxZGMyMCwgMHhmNmFkNzY2ZCwgMHhmZGEzN2Y2MCwgMHhlMGIxNjQ3NywgMHhlYmJmNmQ3YSwgMHhkYTk1NTI1OSwgMHhkMTliNWI1NCwgMHhjYzg5NDA0MywgMHhjNzg3NDk0ZSwgMHhhZWRkM2UwNSwgMHhhNWQzMzcwOCwgMHhiOGMxMmMxZiwgMHhiM2NmMjUxMiwgMHg4MmU1MWEzMSwgMHg4OWViMTMzYywgMHg5NGY5MDgyYiwgMHg5ZmY3MDEyNiwgMHg0NjRkZTZiZCwgMHg0ZDQzZWZiMCwgMHg1MDUxZjRhNywgMHg1YjVmZmRhYSwgMHg2YTc1YzI4OSwgMHg2MTdiY2I4NCwgMHg3YzY5ZDA5MywgMHg3NzY3ZDk5ZSwgMHgxZTNkYWVkNSwgMHgxNTMzYTdkOCwgMHgwODIxYmNjZiwgMHgwMzJmYjVjMiwgMHgzMjA1OGFlMSwgMHgzOTBiODNlYywgMHgyNDE5OThmYiwgMHgyZjE3OTFmNiwgMHg4ZDc2NGRkNiwgMHg4Njc4NDRkYiwgMHg5YjZhNWZjYywgMHg5MDY0NTZjMSwgMHhhMTRlNjllMiwgMHhhYTQwNjBlZiwgMHhiNzUyN2JmOCwgMHhiYzVjNzJmNSwgMHhkNTA2MDViZSwgMHhkZTA4MGNiMywgMHhjMzFhMTdhNCwgMHhjODE0MWVhOSwgMHhmOTNlMjE4YSwgMHhmMjMwMjg4NywgMHhlZjIyMzM5MCwgMHhlNDJjM2E5ZCwgMHgzZDk2ZGQwNiwgMHgzNjk4ZDQwYiwgMHgyYjhhY2YxYywgMHgyMDg0YzYxMSwgMHgxMWFlZjkzMiwgMHgxYWEwZjAzZiwgMHgwN2IyZWIyOCwgMHgwY2JjZTIyNSwgMHg2NWU2OTU2ZSwgMHg2ZWU4OWM2MywgMHg3M2ZhODc3NCwgMHg3OGY0OGU3OSwgMHg0OWRlYjE1YSwgMHg0MmQwYjg1NywgMHg1ZmMyYTM0MCwgMHg1NGNjYWE0ZCwgMHhmNzQxZWNkYSwgMHhmYzRmZTVkNywgMHhlMTVkZmVjMCwgMHhlYTUzZjdjZCwgMHhkYjc5YzhlZSwgMHhkMDc3YzFlMywgMHhjZDY1ZGFmNCwgMHhjNjZiZDNmOSwgMHhhZjMxYTRiMiwgMHhhNDNmYWRiZiwgMHhiOTJkYjZhOCwgMHhiMjIzYmZhNSwgMHg4MzA5ODA4NiwgMHg4ODA3ODk4YiwgMHg5NTE1OTI5YywgMHg5ZTFiOWI5MSwgMHg0N2ExN2MwYSwgMHg0Y2FmNzUwNywgMHg1MWJkNmUxMCwgMHg1YWIzNjcxZCwgMHg2Yjk5NTgzZSwgMHg2MDk3NTEzMywgMHg3ZDg1NGEyNCwgMHg3NjhiNDMyOSwgMHgxZmQxMzQ2MiwgMHgxNGRmM2Q2ZiwgMHgwOWNkMjY3OCwgMHgwMmMzMmY3NSwgMHgzM2U5MTA1NiwgMHgzOGU3MTk1YiwgMHgyNWY1MDI0YywgMHgyZWZiMGI0MSwgMHg4YzlhZDc2MSwgMHg4Nzk0ZGU2YywgMHg5YTg2YzU3YiwgMHg5MTg4Y2M3NiwgMHhhMGEyZjM1NSwgMHhhYmFjZmE1OCwgMHhiNmJlZTE0ZiwgMHhiZGIwZTg0MiwgMHhkNGVhOWYwOSwgMHhkZmU0OTYwNCwgMHhjMmY2OGQxMywgMHhjOWY4ODQxZSwgMHhmOGQyYmIzZCwgMHhmM2RjYjIzMCwgMHhlZWNlYTkyNywgMHhlNWMwYTAyYSwgMHgzYzdhNDdiMSwgMHgzNzc0NGViYywgMHgyYTY2NTVhYiwgMHgyMTY4NWNhNiwgMHgxMDQyNjM4NSwgMHgxYjRjNmE4OCwgMHgwNjVlNzE5ZiwgMHgwZDUwNzg5MiwgMHg2NDBhMGZkOSwgMHg2ZjA0MDZkNCwgMHg3MjE2MWRjMywgMHg3OTE4MTRjZSwgMHg0ODMyMmJlZCwgMHg0MzNjMjJlMCwgMHg1ZTJlMzlmNywgMHg1NTIwMzBmYSwgMHgwMWVjOWFiNywgMHgwYWUyOTNiYSwgMHgxN2YwODhhZCwgMHgxY2ZlODFhMCwgMHgyZGQ0YmU4MywgMHgyNmRhYjc4ZSwgMHgzYmM4YWM5OSwgMHgzMGM2YTU5NCwgMHg1OTljZDJkZiwgMHg1MjkyZGJkMiwgMHg0ZjgwYzBjNSwgMHg0NDhlYzljOCwgMHg3NWE0ZjZlYiwgMHg3ZWFhZmZlNiwgMHg2M2I4ZTRmMSwgMHg2OGI2ZWRmYywgMHhiMTBjMGE2NywgMHhiYTAyMDM2YSwgMHhhNzEwMTg3ZCwgMHhhYzFlMTE3MCwgMHg5ZDM0MmU1MywgMHg5NjNhMjc1ZSwgMHg4YjI4M2M0OSwgMHg4MDI2MzU0NCwgMHhlOTdjNDIwZiwgMHhlMjcyNGIwMiwgMHhmZjYwNTAxNSwgMHhmNDZlNTkxOCwgMHhjNTQ0NjYzYiwgMHhjZTRhNmYzNiwgMHhkMzU4NzQyMSwgMHhkODU2N2QyYywgMHg3YTM3YTEwYywgMHg3MTM5YTgwMSwgMHg2YzJiYjMxNiwgMHg2NzI1YmExYiwgMHg1NjBmODUzOCwgMHg1ZDAxOGMzNSwgMHg0MDEzOTcyMiwgMHg0YjFkOWUyZiwgMHgyMjQ3ZTk2NCwgMHgyOTQ5ZTA2OSwgMHgzNDViZmI3ZSwgMHgzZjU1ZjI3MywgMHgwZTdmY2Q1MCwgMHgwNTcxYzQ1ZCwgMHgxODYzZGY0YSwgMHgxMzZkZDY0NywgMHhjYWQ3MzFkYywgMHhjMWQ5MzhkMSwgMHhkY2NiMjNjNiwgMHhkN2M1MmFjYiwgMHhlNmVmMTVlOCwgMHhlZGUxMWNlNSwgMHhmMGYzMDdmMiwgMHhmYmZkMGVmZiwgMHg5MmE3NzliNCwgMHg5OWE5NzBiOSwgMHg4NGJiNmJhZSwgMHg4ZmI1NjJhMywgMHhiZTlmNWQ4MCwgMHhiNTkxNTQ4ZCwgMHhhODgzNGY5YSwgMHhhMzhkNDY5N107XG4gICAgdmFyIFUzID0gWzB4MDAwMDAwMDAsIDB4MGQwYjBlMDksIDB4MWExNjFjMTIsIDB4MTcxZDEyMWIsIDB4MzQyYzM4MjQsIDB4MzkyNzM2MmQsIDB4MmUzYTI0MzYsIDB4MjMzMTJhM2YsIDB4Njg1ODcwNDgsIDB4NjU1MzdlNDEsIDB4NzI0ZTZjNWEsIDB4N2Y0NTYyNTMsIDB4NWM3NDQ4NmMsIDB4NTE3ZjQ2NjUsIDB4NDY2MjU0N2UsIDB4NGI2OTVhNzcsIDB4ZDBiMGUwOTAsIDB4ZGRiYmVlOTksIDB4Y2FhNmZjODIsIDB4YzdhZGYyOGIsIDB4ZTQ5Y2Q4YjQsIDB4ZTk5N2Q2YmQsIDB4ZmU4YWM0YTYsIDB4ZjM4MWNhYWYsIDB4YjhlODkwZDgsIDB4YjVlMzllZDEsIDB4YTJmZThjY2EsIDB4YWZmNTgyYzMsIDB4OGNjNGE4ZmMsIDB4ODFjZmE2ZjUsIDB4OTZkMmI0ZWUsIDB4OWJkOWJhZTcsIDB4YmI3YmRiM2IsIDB4YjY3MGQ1MzIsIDB4YTE2ZGM3MjksIDB4YWM2NmM5MjAsIDB4OGY1N2UzMWYsIDB4ODI1Y2VkMTYsIDB4OTU0MWZmMGQsIDB4OTg0YWYxMDQsIDB4ZDMyM2FiNzMsIDB4ZGUyOGE1N2EsIDB4YzkzNWI3NjEsIDB4YzQzZWI5NjgsIDB4ZTcwZjkzNTcsIDB4ZWEwNDlkNWUsIDB4ZmQxOThmNDUsIDB4ZjAxMjgxNGMsIDB4NmJjYjNiYWIsIDB4NjZjMDM1YTIsIDB4NzFkZDI3YjksIDB4N2NkNjI5YjAsIDB4NWZlNzAzOGYsIDB4NTJlYzBkODYsIDB4NDVmMTFmOWQsIDB4NDhmYTExOTQsIDB4MDM5MzRiZTMsIDB4MGU5ODQ1ZWEsIDB4MTk4NTU3ZjEsIDB4MTQ4ZTU5ZjgsIDB4MzdiZjczYzcsIDB4M2FiNDdkY2UsIDB4MmRhOTZmZDUsIDB4MjBhMjYxZGMsIDB4NmRmNmFkNzYsIDB4NjBmZGEzN2YsIDB4NzdlMGIxNjQsIDB4N2FlYmJmNmQsIDB4NTlkYTk1NTIsIDB4NTRkMTliNWIsIDB4NDNjYzg5NDAsIDB4NGVjNzg3NDksIDB4MDVhZWRkM2UsIDB4MDhhNWQzMzcsIDB4MWZiOGMxMmMsIDB4MTJiM2NmMjUsIDB4MzE4MmU1MWEsIDB4M2M4OWViMTMsIDB4MmI5NGY5MDgsIDB4MjY5ZmY3MDEsIDB4YmQ0NjRkZTYsIDB4YjA0ZDQzZWYsIDB4YTc1MDUxZjQsIDB4YWE1YjVmZmQsIDB4ODk2YTc1YzIsIDB4ODQ2MTdiY2IsIDB4OTM3YzY5ZDAsIDB4OWU3NzY3ZDksIDB4ZDUxZTNkYWUsIDB4ZDgxNTMzYTcsIDB4Y2YwODIxYmMsIDB4YzIwMzJmYjUsIDB4ZTEzMjA1OGEsIDB4ZWMzOTBiODMsIDB4ZmIyNDE5OTgsIDB4ZjYyZjE3OTEsIDB4ZDY4ZDc2NGQsIDB4ZGI4Njc4NDQsIDB4Y2M5YjZhNWYsIDB4YzE5MDY0NTYsIDB4ZTJhMTRlNjksIDB4ZWZhYTQwNjAsIDB4ZjhiNzUyN2IsIDB4ZjViYzVjNzIsIDB4YmVkNTA2MDUsIDB4YjNkZTA4MGMsIDB4YTRjMzFhMTcsIDB4YTljODE0MWUsIDB4OGFmOTNlMjEsIDB4ODdmMjMwMjgsIDB4OTBlZjIyMzMsIDB4OWRlNDJjM2EsIDB4MDYzZDk2ZGQsIDB4MGIzNjk4ZDQsIDB4MWMyYjhhY2YsIDB4MTEyMDg0YzYsIDB4MzIxMWFlZjksIDB4M2YxYWEwZjAsIDB4MjgwN2IyZWIsIDB4MjUwY2JjZTIsIDB4NmU2NWU2OTUsIDB4NjM2ZWU4OWMsIDB4NzQ3M2ZhODcsIDB4Nzk3OGY0OGUsIDB4NWE0OWRlYjEsIDB4NTc0MmQwYjgsIDB4NDA1ZmMyYTMsIDB4NGQ1NGNjYWEsIDB4ZGFmNzQxZWMsIDB4ZDdmYzRmZTUsIDB4YzBlMTVkZmUsIDB4Y2RlYTUzZjcsIDB4ZWVkYjc5YzgsIDB4ZTNkMDc3YzEsIDB4ZjRjZDY1ZGEsIDB4ZjljNjZiZDMsIDB4YjJhZjMxYTQsIDB4YmZhNDNmYWQsIDB4YThiOTJkYjYsIDB4YTViMjIzYmYsIDB4ODY4MzA5ODAsIDB4OGI4ODA3ODksIDB4OWM5NTE1OTIsIDB4OTE5ZTFiOWIsIDB4MGE0N2ExN2MsIDB4MDc0Y2FmNzUsIDB4MTA1MWJkNmUsIDB4MWQ1YWIzNjcsIDB4M2U2Yjk5NTgsIDB4MzM2MDk3NTEsIDB4MjQ3ZDg1NGEsIDB4Mjk3NjhiNDMsIDB4NjIxZmQxMzQsIDB4NmYxNGRmM2QsIDB4NzgwOWNkMjYsIDB4NzUwMmMzMmYsIDB4NTYzM2U5MTAsIDB4NWIzOGU3MTksIDB4NGMyNWY1MDIsIDB4NDEyZWZiMGIsIDB4NjE4YzlhZDcsIDB4NmM4Nzk0ZGUsIDB4N2I5YTg2YzUsIDB4NzY5MTg4Y2MsIDB4NTVhMGEyZjMsIDB4NThhYmFjZmEsIDB4NGZiNmJlZTEsIDB4NDJiZGIwZTgsIDB4MDlkNGVhOWYsIDB4MDRkZmU0OTYsIDB4MTNjMmY2OGQsIDB4MWVjOWY4ODQsIDB4M2RmOGQyYmIsIDB4MzBmM2RjYjIsIDB4MjdlZWNlYTksIDB4MmFlNWMwYTAsIDB4YjEzYzdhNDcsIDB4YmMzNzc0NGUsIDB4YWIyYTY2NTUsIDB4YTYyMTY4NWMsIDB4ODUxMDQyNjMsIDB4ODgxYjRjNmEsIDB4OWYwNjVlNzEsIDB4OTIwZDUwNzgsIDB4ZDk2NDBhMGYsIDB4ZDQ2ZjA0MDYsIDB4YzM3MjE2MWQsIDB4Y2U3OTE4MTQsIDB4ZWQ0ODMyMmIsIDB4ZTA0MzNjMjIsIDB4Zjc1ZTJlMzksIDB4ZmE1NTIwMzAsIDB4YjcwMWVjOWEsIDB4YmEwYWUyOTMsIDB4YWQxN2YwODgsIDB4YTAxY2ZlODEsIDB4ODMyZGQ0YmUsIDB4OGUyNmRhYjcsIDB4OTkzYmM4YWMsIDB4OTQzMGM2YTUsIDB4ZGY1OTljZDIsIDB4ZDI1MjkyZGIsIDB4YzU0ZjgwYzAsIDB4Yzg0NDhlYzksIDB4ZWI3NWE0ZjYsIDB4ZTY3ZWFhZmYsIDB4ZjE2M2I4ZTQsIDB4ZmM2OGI2ZWQsIDB4NjdiMTBjMGEsIDB4NmFiYTAyMDMsIDB4N2RhNzEwMTgsIDB4NzBhYzFlMTEsIDB4NTM5ZDM0MmUsIDB4NWU5NjNhMjcsIDB4NDk4YjI4M2MsIDB4NDQ4MDI2MzUsIDB4MGZlOTdjNDIsIDB4MDJlMjcyNGIsIDB4MTVmZjYwNTAsIDB4MThmNDZlNTksIDB4M2JjNTQ0NjYsIDB4MzZjZTRhNmYsIDB4MjFkMzU4NzQsIDB4MmNkODU2N2QsIDB4MGM3YTM3YTEsIDB4MDE3MTM5YTgsIDB4MTY2YzJiYjMsIDB4MWI2NzI1YmEsIDB4Mzg1NjBmODUsIDB4MzU1ZDAxOGMsIDB4MjI0MDEzOTcsIDB4MmY0YjFkOWUsIDB4NjQyMjQ3ZTksIDB4NjkyOTQ5ZTAsIDB4N2UzNDViZmIsIDB4NzMzZjU1ZjIsIDB4NTAwZTdmY2QsIDB4NWQwNTcxYzQsIDB4NGExODYzZGYsIDB4NDcxMzZkZDYsIDB4ZGNjYWQ3MzEsIDB4ZDFjMWQ5MzgsIDB4YzZkY2NiMjMsIDB4Y2JkN2M1MmEsIDB4ZThlNmVmMTUsIDB4ZTVlZGUxMWMsIDB4ZjJmMGYzMDcsIDB4ZmZmYmZkMGUsIDB4YjQ5MmE3NzksIDB4Yjk5OWE5NzAsIDB4YWU4NGJiNmIsIDB4YTM4ZmI1NjIsIDB4ODBiZTlmNWQsIDB4OGRiNTkxNTQsIDB4OWFhODgzNGYsIDB4OTdhMzhkNDZdO1xuICAgIHZhciBVNCA9IFsweDAwMDAwMDAwLCAweDA5MGQwYjBlLCAweDEyMWExNjFjLCAweDFiMTcxZDEyLCAweDI0MzQyYzM4LCAweDJkMzkyNzM2LCAweDM2MmUzYTI0LCAweDNmMjMzMTJhLCAweDQ4Njg1ODcwLCAweDQxNjU1MzdlLCAweDVhNzI0ZTZjLCAweDUzN2Y0NTYyLCAweDZjNWM3NDQ4LCAweDY1NTE3ZjQ2LCAweDdlNDY2MjU0LCAweDc3NGI2OTVhLCAweDkwZDBiMGUwLCAweDk5ZGRiYmVlLCAweDgyY2FhNmZjLCAweDhiYzdhZGYyLCAweGI0ZTQ5Y2Q4LCAweGJkZTk5N2Q2LCAweGE2ZmU4YWM0LCAweGFmZjM4MWNhLCAweGQ4YjhlODkwLCAweGQxYjVlMzllLCAweGNhYTJmZThjLCAweGMzYWZmNTgyLCAweGZjOGNjNGE4LCAweGY1ODFjZmE2LCAweGVlOTZkMmI0LCAweGU3OWJkOWJhLCAweDNiYmI3YmRiLCAweDMyYjY3MGQ1LCAweDI5YTE2ZGM3LCAweDIwYWM2NmM5LCAweDFmOGY1N2UzLCAweDE2ODI1Y2VkLCAweDBkOTU0MWZmLCAweDA0OTg0YWYxLCAweDczZDMyM2FiLCAweDdhZGUyOGE1LCAweDYxYzkzNWI3LCAweDY4YzQzZWI5LCAweDU3ZTcwZjkzLCAweDVlZWEwNDlkLCAweDQ1ZmQxOThmLCAweDRjZjAxMjgxLCAweGFiNmJjYjNiLCAweGEyNjZjMDM1LCAweGI5NzFkZDI3LCAweGIwN2NkNjI5LCAweDhmNWZlNzAzLCAweDg2NTJlYzBkLCAweDlkNDVmMTFmLCAweDk0NDhmYTExLCAweGUzMDM5MzRiLCAweGVhMGU5ODQ1LCAweGYxMTk4NTU3LCAweGY4MTQ4ZTU5LCAweGM3MzdiZjczLCAweGNlM2FiNDdkLCAweGQ1MmRhOTZmLCAweGRjMjBhMjYxLCAweDc2NmRmNmFkLCAweDdmNjBmZGEzLCAweDY0NzdlMGIxLCAweDZkN2FlYmJmLCAweDUyNTlkYTk1LCAweDViNTRkMTliLCAweDQwNDNjYzg5LCAweDQ5NGVjNzg3LCAweDNlMDVhZWRkLCAweDM3MDhhNWQzLCAweDJjMWZiOGMxLCAweDI1MTJiM2NmLCAweDFhMzE4MmU1LCAweDEzM2M4OWViLCAweDA4MmI5NGY5LCAweDAxMjY5ZmY3LCAweGU2YmQ0NjRkLCAweGVmYjA0ZDQzLCAweGY0YTc1MDUxLCAweGZkYWE1YjVmLCAweGMyODk2YTc1LCAweGNiODQ2MTdiLCAweGQwOTM3YzY5LCAweGQ5OWU3NzY3LCAweGFlZDUxZTNkLCAweGE3ZDgxNTMzLCAweGJjY2YwODIxLCAweGI1YzIwMzJmLCAweDhhZTEzMjA1LCAweDgzZWMzOTBiLCAweDk4ZmIyNDE5LCAweDkxZjYyZjE3LCAweDRkZDY4ZDc2LCAweDQ0ZGI4Njc4LCAweDVmY2M5YjZhLCAweDU2YzE5MDY0LCAweDY5ZTJhMTRlLCAweDYwZWZhYTQwLCAweDdiZjhiNzUyLCAweDcyZjViYzVjLCAweDA1YmVkNTA2LCAweDBjYjNkZTA4LCAweDE3YTRjMzFhLCAweDFlYTljODE0LCAweDIxOGFmOTNlLCAweDI4ODdmMjMwLCAweDMzOTBlZjIyLCAweDNhOWRlNDJjLCAweGRkMDYzZDk2LCAweGQ0MGIzNjk4LCAweGNmMWMyYjhhLCAweGM2MTEyMDg0LCAweGY5MzIxMWFlLCAweGYwM2YxYWEwLCAweGViMjgwN2IyLCAweGUyMjUwY2JjLCAweDk1NmU2NWU2LCAweDljNjM2ZWU4LCAweDg3NzQ3M2ZhLCAweDhlNzk3OGY0LCAweGIxNWE0OWRlLCAweGI4NTc0MmQwLCAweGEzNDA1ZmMyLCAweGFhNGQ1NGNjLCAweGVjZGFmNzQxLCAweGU1ZDdmYzRmLCAweGZlYzBlMTVkLCAweGY3Y2RlYTUzLCAweGM4ZWVkYjc5LCAweGMxZTNkMDc3LCAweGRhZjRjZDY1LCAweGQzZjljNjZiLCAweGE0YjJhZjMxLCAweGFkYmZhNDNmLCAweGI2YThiOTJkLCAweGJmYTViMjIzLCAweDgwODY4MzA5LCAweDg5OGI4ODA3LCAweDkyOWM5NTE1LCAweDliOTE5ZTFiLCAweDdjMGE0N2ExLCAweDc1MDc0Y2FmLCAweDZlMTA1MWJkLCAweDY3MWQ1YWIzLCAweDU4M2U2Yjk5LCAweDUxMzM2MDk3LCAweDRhMjQ3ZDg1LCAweDQzMjk3NjhiLCAweDM0NjIxZmQxLCAweDNkNmYxNGRmLCAweDI2NzgwOWNkLCAweDJmNzUwMmMzLCAweDEwNTYzM2U5LCAweDE5NWIzOGU3LCAweDAyNGMyNWY1LCAweDBiNDEyZWZiLCAweGQ3NjE4YzlhLCAweGRlNmM4Nzk0LCAweGM1N2I5YTg2LCAweGNjNzY5MTg4LCAweGYzNTVhMGEyLCAweGZhNThhYmFjLCAweGUxNGZiNmJlLCAweGU4NDJiZGIwLCAweDlmMDlkNGVhLCAweDk2MDRkZmU0LCAweDhkMTNjMmY2LCAweDg0MWVjOWY4LCAweGJiM2RmOGQyLCAweGIyMzBmM2RjLCAweGE5MjdlZWNlLCAweGEwMmFlNWMwLCAweDQ3YjEzYzdhLCAweDRlYmMzNzc0LCAweDU1YWIyYTY2LCAweDVjYTYyMTY4LCAweDYzODUxMDQyLCAweDZhODgxYjRjLCAweDcxOWYwNjVlLCAweDc4OTIwZDUwLCAweDBmZDk2NDBhLCAweDA2ZDQ2ZjA0LCAweDFkYzM3MjE2LCAweDE0Y2U3OTE4LCAweDJiZWQ0ODMyLCAweDIyZTA0MzNjLCAweDM5Zjc1ZTJlLCAweDMwZmE1NTIwLCAweDlhYjcwMWVjLCAweDkzYmEwYWUyLCAweDg4YWQxN2YwLCAweDgxYTAxY2ZlLCAweGJlODMyZGQ0LCAweGI3OGUyNmRhLCAweGFjOTkzYmM4LCAweGE1OTQzMGM2LCAweGQyZGY1OTljLCAweGRiZDI1MjkyLCAweGMwYzU0ZjgwLCAweGM5Yzg0NDhlLCAweGY2ZWI3NWE0LCAweGZmZTY3ZWFhLCAweGU0ZjE2M2I4LCAweGVkZmM2OGI2LCAweDBhNjdiMTBjLCAweDAzNmFiYTAyLCAweDE4N2RhNzEwLCAweDExNzBhYzFlLCAweDJlNTM5ZDM0LCAweDI3NWU5NjNhLCAweDNjNDk4YjI4LCAweDM1NDQ4MDI2LCAweDQyMGZlOTdjLCAweDRiMDJlMjcyLCAweDUwMTVmZjYwLCAweDU5MThmNDZlLCAweDY2M2JjNTQ0LCAweDZmMzZjZTRhLCAweDc0MjFkMzU4LCAweDdkMmNkODU2LCAweGExMGM3YTM3LCAweGE4MDE3MTM5LCAweGIzMTY2YzJiLCAweGJhMWI2NzI1LCAweDg1Mzg1NjBmLCAweDhjMzU1ZDAxLCAweDk3MjI0MDEzLCAweDllMmY0YjFkLCAweGU5NjQyMjQ3LCAweGUwNjkyOTQ5LCAweGZiN2UzNDViLCAweGYyNzMzZjU1LCAweGNkNTAwZTdmLCAweGM0NWQwNTcxLCAweGRmNGExODYzLCAweGQ2NDcxMzZkLCAweDMxZGNjYWQ3LCAweDM4ZDFjMWQ5LCAweDIzYzZkY2NiLCAweDJhY2JkN2M1LCAweDE1ZThlNmVmLCAweDFjZTVlZGUxLCAweDA3ZjJmMGYzLCAweDBlZmZmYmZkLCAweDc5YjQ5MmE3LCAweDcwYjk5OWE5LCAweDZiYWU4NGJiLCAweDYyYTM4ZmI1LCAweDVkODBiZTlmLCAweDU0OGRiNTkxLCAweDRmOWFhODgzLCAweDQ2OTdhMzhkXTtcblxuICAgIGZ1bmN0aW9uIGNvbnZlcnRUb0ludDMyKGJ5dGVzKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gNCkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goXG4gICAgICAgICAgICAgICAgKGJ5dGVzW2kgICAgXSA8PCAyNCkgfFxuICAgICAgICAgICAgICAgIChieXRlc1tpICsgMV0gPDwgMTYpIHxcbiAgICAgICAgICAgICAgICAoYnl0ZXNbaSArIDJdIDw8ICA4KSB8XG4gICAgICAgICAgICAgICAgIGJ5dGVzW2kgKyAzXVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHZhciBBRVMgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEFFUykpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdBRVMgbXVzdCBiZSBpbnN0YW5pdGF0ZWQgd2l0aCBgbmV3YCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdrZXknLCB7XG4gICAgICAgICAgICB2YWx1ZTogY29lcmNlQXJyYXkoa2V5LCB0cnVlKVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9wcmVwYXJlKCk7XG4gICAgfVxuXG5cbiAgICBBRVMucHJvdG90eXBlLl9wcmVwYXJlID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIHJvdW5kcyA9IG51bWJlck9mUm91bmRzW3RoaXMua2V5Lmxlbmd0aF07XG4gICAgICAgIGlmIChyb3VuZHMgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIGtleSBzaXplIChtdXN0IGJlIDE2LCAyNCBvciAzMiBieXRlcyknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGVuY3J5cHRpb24gcm91bmQga2V5c1xuICAgICAgICB0aGlzLl9LZSA9IFtdO1xuXG4gICAgICAgIC8vIGRlY3J5cHRpb24gcm91bmQga2V5c1xuICAgICAgICB0aGlzLl9LZCA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHJvdW5kczsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLl9LZS5wdXNoKFswLCAwLCAwLCAwXSk7XG4gICAgICAgICAgICB0aGlzLl9LZC5wdXNoKFswLCAwLCAwLCAwXSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcm91bmRLZXlDb3VudCA9IChyb3VuZHMgKyAxKSAqIDQ7XG4gICAgICAgIHZhciBLQyA9IHRoaXMua2V5Lmxlbmd0aCAvIDQ7XG5cbiAgICAgICAgLy8gY29udmVydCB0aGUga2V5IGludG8gaW50c1xuICAgICAgICB2YXIgdGsgPSBjb252ZXJ0VG9JbnQzMih0aGlzLmtleSk7XG5cbiAgICAgICAgLy8gY29weSB2YWx1ZXMgaW50byByb3VuZCBrZXkgYXJyYXlzXG4gICAgICAgIHZhciBpbmRleDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBLQzsgaSsrKSB7XG4gICAgICAgICAgICBpbmRleCA9IGkgPj4gMjtcbiAgICAgICAgICAgIHRoaXMuX0tlW2luZGV4XVtpICUgNF0gPSB0a1tpXTtcbiAgICAgICAgICAgIHRoaXMuX0tkW3JvdW5kcyAtIGluZGV4XVtpICUgNF0gPSB0a1tpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGtleSBleHBhbnNpb24gKGZpcHMtMTk3IHNlY3Rpb24gNS4yKVxuICAgICAgICB2YXIgcmNvbnBvaW50ZXIgPSAwO1xuICAgICAgICB2YXIgdCA9IEtDLCB0dDtcbiAgICAgICAgd2hpbGUgKHQgPCByb3VuZEtleUNvdW50KSB7XG4gICAgICAgICAgICB0dCA9IHRrW0tDIC0gMV07XG4gICAgICAgICAgICB0a1swXSBePSAoKFNbKHR0ID4+IDE2KSAmIDB4RkZdIDw8IDI0KSBeXG4gICAgICAgICAgICAgICAgICAgICAgKFNbKHR0ID4+ICA4KSAmIDB4RkZdIDw8IDE2KSBeXG4gICAgICAgICAgICAgICAgICAgICAgKFNbIHR0ICAgICAgICAmIDB4RkZdIDw8ICA4KSBeXG4gICAgICAgICAgICAgICAgICAgICAgIFNbKHR0ID4+IDI0KSAmIDB4RkZdICAgICAgICBeXG4gICAgICAgICAgICAgICAgICAgICAgKHJjb25bcmNvbnBvaW50ZXJdIDw8IDI0KSk7XG4gICAgICAgICAgICByY29ucG9pbnRlciArPSAxO1xuXG4gICAgICAgICAgICAvLyBrZXkgZXhwYW5zaW9uIChmb3Igbm9uLTI1NiBiaXQpXG4gICAgICAgICAgICBpZiAoS0MgIT0gOCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgS0M7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB0a1tpXSBePSB0a1tpIC0gMV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBrZXkgZXhwYW5zaW9uIGZvciAyNTYtYml0IGtleXMgaXMgXCJzbGlnaHRseSBkaWZmZXJlbnRcIiAoZmlwcy0xOTcpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgKEtDIC8gMik7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB0a1tpXSBePSB0a1tpIC0gMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHR0ID0gdGtbKEtDIC8gMikgLSAxXTtcblxuICAgICAgICAgICAgICAgIHRrW0tDIC8gMl0gXj0gKFNbIHR0ICAgICAgICAmIDB4RkZdICAgICAgICBeXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoU1sodHQgPj4gIDgpICYgMHhGRl0gPDwgIDgpIF5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChTWyh0dCA+PiAxNikgJiAweEZGXSA8PCAxNikgXlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKFNbKHR0ID4+IDI0KSAmIDB4RkZdIDw8IDI0KSk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gKEtDIC8gMikgKyAxOyBpIDwgS0M7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB0a1tpXSBePSB0a1tpIC0gMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjb3B5IHZhbHVlcyBpbnRvIHJvdW5kIGtleSBhcnJheXNcbiAgICAgICAgICAgIHZhciBpID0gMCwgciwgYztcbiAgICAgICAgICAgIHdoaWxlIChpIDwgS0MgJiYgdCA8IHJvdW5kS2V5Q291bnQpIHtcbiAgICAgICAgICAgICAgICByID0gdCA+PiAyO1xuICAgICAgICAgICAgICAgIGMgPSB0ICUgNDtcbiAgICAgICAgICAgICAgICB0aGlzLl9LZVtyXVtjXSA9IHRrW2ldO1xuICAgICAgICAgICAgICAgIHRoaXMuX0tkW3JvdW5kcyAtIHJdW2NdID0gdGtbaSsrXTtcbiAgICAgICAgICAgICAgICB0Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpbnZlcnNlLWNpcGhlci1pZnkgdGhlIGRlY3J5cHRpb24gcm91bmQga2V5IChmaXBzLTE5NyBzZWN0aW9uIDUuMylcbiAgICAgICAgZm9yICh2YXIgciA9IDE7IHIgPCByb3VuZHM7IHIrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgYyA9IDA7IGMgPCA0OyBjKyspIHtcbiAgICAgICAgICAgICAgICB0dCA9IHRoaXMuX0tkW3JdW2NdO1xuICAgICAgICAgICAgICAgIHRoaXMuX0tkW3JdW2NdID0gKFUxWyh0dCA+PiAyNCkgJiAweEZGXSBeXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVTJbKHR0ID4+IDE2KSAmIDB4RkZdIF5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBVM1sodHQgPj4gIDgpICYgMHhGRl0gXlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFU0WyB0dCAgICAgICAgJiAweEZGXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBBRVMucHJvdG90eXBlLmVuY3J5cHQgPSBmdW5jdGlvbihwbGFpbnRleHQpIHtcbiAgICAgICAgaWYgKHBsYWludGV4dC5sZW5ndGggIT0gMTYpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBwbGFpbnRleHQgc2l6ZSAobXVzdCBiZSAxNiBieXRlcyknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByb3VuZHMgPSB0aGlzLl9LZS5sZW5ndGggLSAxO1xuICAgICAgICB2YXIgYSA9IFswLCAwLCAwLCAwXTtcblxuICAgICAgICAvLyBjb252ZXJ0IHBsYWludGV4dCB0byAoaW50cyBeIGtleSlcbiAgICAgICAgdmFyIHQgPSBjb252ZXJ0VG9JbnQzMihwbGFpbnRleHQpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdFtpXSBePSB0aGlzLl9LZVswXVtpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFwcGx5IHJvdW5kIHRyYW5zZm9ybXNcbiAgICAgICAgZm9yICh2YXIgciA9IDE7IHIgPCByb3VuZHM7IHIrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgICAgICBhW2ldID0gKFQxWyh0WyBpICAgICAgICAgXSA+PiAyNCkgJiAweGZmXSBeXG4gICAgICAgICAgICAgICAgICAgICAgICBUMlsodFsoaSArIDEpICUgNF0gPj4gMTYpICYgMHhmZl0gXlxuICAgICAgICAgICAgICAgICAgICAgICAgVDNbKHRbKGkgKyAyKSAlIDRdID4+ICA4KSAmIDB4ZmZdIF5cbiAgICAgICAgICAgICAgICAgICAgICAgIFQ0WyB0WyhpICsgMykgJSA0XSAgICAgICAgJiAweGZmXSBeXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9LZVtyXVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ID0gYS5zbGljZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGhlIGxhc3Qgcm91bmQgaXMgc3BlY2lhbFxuICAgICAgICB2YXIgcmVzdWx0ID0gY3JlYXRlQXJyYXkoMTYpLCB0dDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHR0ID0gdGhpcy5fS2Vbcm91bmRzXVtpXTtcbiAgICAgICAgICAgIHJlc3VsdFs0ICogaSAgICBdID0gKFNbKHRbIGkgICAgICAgICBdID4+IDI0KSAmIDB4ZmZdIF4gKHR0ID4+IDI0KSkgJiAweGZmO1xuICAgICAgICAgICAgcmVzdWx0WzQgKiBpICsgMV0gPSAoU1sodFsoaSArIDEpICUgNF0gPj4gMTYpICYgMHhmZl0gXiAodHQgPj4gMTYpKSAmIDB4ZmY7XG4gICAgICAgICAgICByZXN1bHRbNCAqIGkgKyAyXSA9IChTWyh0WyhpICsgMikgJSA0XSA+PiAgOCkgJiAweGZmXSBeICh0dCA+PiAgOCkpICYgMHhmZjtcbiAgICAgICAgICAgIHJlc3VsdFs0ICogaSArIDNdID0gKFNbIHRbKGkgKyAzKSAlIDRdICAgICAgICAmIDB4ZmZdIF4gIHR0ICAgICAgICkgJiAweGZmO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBBRVMucHJvdG90eXBlLmRlY3J5cHQgPSBmdW5jdGlvbihjaXBoZXJ0ZXh0KSB7XG4gICAgICAgIGlmIChjaXBoZXJ0ZXh0Lmxlbmd0aCAhPSAxNikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIGNpcGhlcnRleHQgc2l6ZSAobXVzdCBiZSAxNiBieXRlcyknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByb3VuZHMgPSB0aGlzLl9LZC5sZW5ndGggLSAxO1xuICAgICAgICB2YXIgYSA9IFswLCAwLCAwLCAwXTtcblxuICAgICAgICAvLyBjb252ZXJ0IHBsYWludGV4dCB0byAoaW50cyBeIGtleSlcbiAgICAgICAgdmFyIHQgPSBjb252ZXJ0VG9JbnQzMihjaXBoZXJ0ZXh0KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRbaV0gXj0gdGhpcy5fS2RbMF1baV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhcHBseSByb3VuZCB0cmFuc2Zvcm1zXG4gICAgICAgIGZvciAodmFyIHIgPSAxOyByIDwgcm91bmRzOyByKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgYVtpXSA9IChUNVsodFsgaSAgICAgICAgICBdID4+IDI0KSAmIDB4ZmZdIF5cbiAgICAgICAgICAgICAgICAgICAgICAgIFQ2Wyh0WyhpICsgMykgJSA0XSA+PiAxNikgJiAweGZmXSBeXG4gICAgICAgICAgICAgICAgICAgICAgICBUN1sodFsoaSArIDIpICUgNF0gPj4gIDgpICYgMHhmZl0gXlxuICAgICAgICAgICAgICAgICAgICAgICAgVDhbIHRbKGkgKyAxKSAlIDRdICAgICAgICAmIDB4ZmZdIF5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX0tkW3JdW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHQgPSBhLnNsaWNlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGUgbGFzdCByb3VuZCBpcyBzcGVjaWFsXG4gICAgICAgIHZhciByZXN1bHQgPSBjcmVhdGVBcnJheSgxNiksIHR0O1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdHQgPSB0aGlzLl9LZFtyb3VuZHNdW2ldO1xuICAgICAgICAgICAgcmVzdWx0WzQgKiBpICAgIF0gPSAoU2lbKHRbIGkgICAgICAgICBdID4+IDI0KSAmIDB4ZmZdIF4gKHR0ID4+IDI0KSkgJiAweGZmO1xuICAgICAgICAgICAgcmVzdWx0WzQgKiBpICsgMV0gPSAoU2lbKHRbKGkgKyAzKSAlIDRdID4+IDE2KSAmIDB4ZmZdIF4gKHR0ID4+IDE2KSkgJiAweGZmO1xuICAgICAgICAgICAgcmVzdWx0WzQgKiBpICsgMl0gPSAoU2lbKHRbKGkgKyAyKSAlIDRdID4+ICA4KSAmIDB4ZmZdIF4gKHR0ID4+ICA4KSkgJiAweGZmO1xuICAgICAgICAgICAgcmVzdWx0WzQgKiBpICsgM10gPSAoU2lbIHRbKGkgKyAxKSAlIDRdICAgICAgICAmIDB4ZmZdIF4gIHR0ICAgICAgICkgJiAweGZmO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqICBNb2RlIE9mIE9wZXJhdGlvbiAtIEVsZWN0b25pYyBDb2RlYm9vayAoRUNCKVxuICAgICAqL1xuICAgIHZhciBNb2RlT2ZPcGVyYXRpb25FQ0IgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIE1vZGVPZk9wZXJhdGlvbkVDQikpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdBRVMgbXVzdCBiZSBpbnN0YW5pdGF0ZWQgd2l0aCBgbmV3YCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiRWxlY3Ryb25pYyBDb2RlIEJsb2NrXCI7XG4gICAgICAgIHRoaXMubmFtZSA9IFwiZWNiXCI7XG5cbiAgICAgICAgdGhpcy5fYWVzID0gbmV3IEFFUyhrZXkpO1xuICAgIH1cblxuICAgIE1vZGVPZk9wZXJhdGlvbkVDQi5wcm90b3R5cGUuZW5jcnlwdCA9IGZ1bmN0aW9uKHBsYWludGV4dCkge1xuICAgICAgICBwbGFpbnRleHQgPSBjb2VyY2VBcnJheShwbGFpbnRleHQpO1xuXG4gICAgICAgIGlmICgocGxhaW50ZXh0Lmxlbmd0aCAlIDE2KSAhPT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHBsYWludGV4dCBzaXplIChtdXN0IGJlIG11bHRpcGxlIG9mIDE2IGJ5dGVzKScpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNpcGhlcnRleHQgPSBjcmVhdGVBcnJheShwbGFpbnRleHQubGVuZ3RoKTtcbiAgICAgICAgdmFyIGJsb2NrID0gY3JlYXRlQXJyYXkoMTYpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGxhaW50ZXh0Lmxlbmd0aDsgaSArPSAxNikge1xuICAgICAgICAgICAgY29weUFycmF5KHBsYWludGV4dCwgYmxvY2ssIDAsIGksIGkgKyAxNik7XG4gICAgICAgICAgICBibG9jayA9IHRoaXMuX2Flcy5lbmNyeXB0KGJsb2NrKTtcbiAgICAgICAgICAgIGNvcHlBcnJheShibG9jaywgY2lwaGVydGV4dCwgaSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2lwaGVydGV4dDtcbiAgICB9XG5cbiAgICBNb2RlT2ZPcGVyYXRpb25FQ0IucHJvdG90eXBlLmRlY3J5cHQgPSBmdW5jdGlvbihjaXBoZXJ0ZXh0KSB7XG4gICAgICAgIGNpcGhlcnRleHQgPSBjb2VyY2VBcnJheShjaXBoZXJ0ZXh0KTtcblxuICAgICAgICBpZiAoKGNpcGhlcnRleHQubGVuZ3RoICUgMTYpICE9PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgY2lwaGVydGV4dCBzaXplIChtdXN0IGJlIG11bHRpcGxlIG9mIDE2IGJ5dGVzKScpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBsYWludGV4dCA9IGNyZWF0ZUFycmF5KGNpcGhlcnRleHQubGVuZ3RoKTtcbiAgICAgICAgdmFyIGJsb2NrID0gY3JlYXRlQXJyYXkoMTYpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2lwaGVydGV4dC5sZW5ndGg7IGkgKz0gMTYpIHtcbiAgICAgICAgICAgIGNvcHlBcnJheShjaXBoZXJ0ZXh0LCBibG9jaywgMCwgaSwgaSArIDE2KTtcbiAgICAgICAgICAgIGJsb2NrID0gdGhpcy5fYWVzLmRlY3J5cHQoYmxvY2spO1xuICAgICAgICAgICAgY29weUFycmF5KGJsb2NrLCBwbGFpbnRleHQsIGkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBsYWludGV4dDtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqICBNb2RlIE9mIE9wZXJhdGlvbiAtIENpcGhlciBCbG9jayBDaGFpbmluZyAoQ0JDKVxuICAgICAqL1xuICAgIHZhciBNb2RlT2ZPcGVyYXRpb25DQkMgPSBmdW5jdGlvbihrZXksIGl2KSB7XG4gICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBNb2RlT2ZPcGVyYXRpb25DQkMpKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignQUVTIG11c3QgYmUgaW5zdGFuaXRhdGVkIHdpdGggYG5ld2AnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkNpcGhlciBCbG9jayBDaGFpbmluZ1wiO1xuICAgICAgICB0aGlzLm5hbWUgPSBcImNiY1wiO1xuXG4gICAgICAgIGlmICghaXYpIHtcbiAgICAgICAgICAgIGl2ID0gY3JlYXRlQXJyYXkoMTYpO1xuXG4gICAgICAgIH0gZWxzZSBpZiAoaXYubGVuZ3RoICE9IDE2KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgaW5pdGlhbGF0aW9uIHZlY3RvciBzaXplIChtdXN0IGJlIDE2IGJ5dGVzKScpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fbGFzdENpcGhlcmJsb2NrID0gY29lcmNlQXJyYXkoaXYsIHRydWUpO1xuXG4gICAgICAgIHRoaXMuX2FlcyA9IG5ldyBBRVMoa2V5KTtcbiAgICB9XG5cbiAgICBNb2RlT2ZPcGVyYXRpb25DQkMucHJvdG90eXBlLmVuY3J5cHQgPSBmdW5jdGlvbihwbGFpbnRleHQpIHtcbiAgICAgICAgcGxhaW50ZXh0ID0gY29lcmNlQXJyYXkocGxhaW50ZXh0KTtcblxuICAgICAgICBpZiAoKHBsYWludGV4dC5sZW5ndGggJSAxNikgIT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBwbGFpbnRleHQgc2l6ZSAobXVzdCBiZSBtdWx0aXBsZSBvZiAxNiBieXRlcyknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjaXBoZXJ0ZXh0ID0gY3JlYXRlQXJyYXkocGxhaW50ZXh0Lmxlbmd0aCk7XG4gICAgICAgIHZhciBibG9jayA9IGNyZWF0ZUFycmF5KDE2KTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBsYWludGV4dC5sZW5ndGg7IGkgKz0gMTYpIHtcbiAgICAgICAgICAgIGNvcHlBcnJheShwbGFpbnRleHQsIGJsb2NrLCAwLCBpLCBpICsgMTYpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDE2OyBqKyspIHtcbiAgICAgICAgICAgICAgICBibG9ja1tqXSBePSB0aGlzLl9sYXN0Q2lwaGVyYmxvY2tbal07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2xhc3RDaXBoZXJibG9jayA9IHRoaXMuX2Flcy5lbmNyeXB0KGJsb2NrKTtcbiAgICAgICAgICAgIGNvcHlBcnJheSh0aGlzLl9sYXN0Q2lwaGVyYmxvY2ssIGNpcGhlcnRleHQsIGkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNpcGhlcnRleHQ7XG4gICAgfVxuXG4gICAgTW9kZU9mT3BlcmF0aW9uQ0JDLnByb3RvdHlwZS5kZWNyeXB0ID0gZnVuY3Rpb24oY2lwaGVydGV4dCkge1xuICAgICAgICBjaXBoZXJ0ZXh0ID0gY29lcmNlQXJyYXkoY2lwaGVydGV4dCk7XG5cbiAgICAgICAgaWYgKChjaXBoZXJ0ZXh0Lmxlbmd0aCAlIDE2KSAhPT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIGNpcGhlcnRleHQgc2l6ZSAobXVzdCBiZSBtdWx0aXBsZSBvZiAxNiBieXRlcyknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwbGFpbnRleHQgPSBjcmVhdGVBcnJheShjaXBoZXJ0ZXh0Lmxlbmd0aCk7XG4gICAgICAgIHZhciBibG9jayA9IGNyZWF0ZUFycmF5KDE2KTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNpcGhlcnRleHQubGVuZ3RoOyBpICs9IDE2KSB7XG4gICAgICAgICAgICBjb3B5QXJyYXkoY2lwaGVydGV4dCwgYmxvY2ssIDAsIGksIGkgKyAxNik7XG4gICAgICAgICAgICBibG9jayA9IHRoaXMuX2Flcy5kZWNyeXB0KGJsb2NrKTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCAxNjsgaisrKSB7XG4gICAgICAgICAgICAgICAgcGxhaW50ZXh0W2kgKyBqXSA9IGJsb2NrW2pdIF4gdGhpcy5fbGFzdENpcGhlcmJsb2NrW2pdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb3B5QXJyYXkoY2lwaGVydGV4dCwgdGhpcy5fbGFzdENpcGhlcmJsb2NrLCAwLCBpLCBpICsgMTYpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBsYWludGV4dDtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqICBNb2RlIE9mIE9wZXJhdGlvbiAtIENpcGhlciBGZWVkYmFjayAoQ0ZCKVxuICAgICAqL1xuICAgIHZhciBNb2RlT2ZPcGVyYXRpb25DRkIgPSBmdW5jdGlvbihrZXksIGl2LCBzZWdtZW50U2l6ZSkge1xuICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTW9kZU9mT3BlcmF0aW9uQ0ZCKSkge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0FFUyBtdXN0IGJlIGluc3Rhbml0YXRlZCB3aXRoIGBuZXdgJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJDaXBoZXIgRmVlZGJhY2tcIjtcbiAgICAgICAgdGhpcy5uYW1lID0gXCJjZmJcIjtcblxuICAgICAgICBpZiAoIWl2KSB7XG4gICAgICAgICAgICBpdiA9IGNyZWF0ZUFycmF5KDE2KTtcblxuICAgICAgICB9IGVsc2UgaWYgKGl2Lmxlbmd0aCAhPSAxNikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIGluaXRpYWxhdGlvbiB2ZWN0b3Igc2l6ZSAobXVzdCBiZSAxNiBzaXplKScpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzZWdtZW50U2l6ZSkgeyBzZWdtZW50U2l6ZSA9IDE7IH1cblxuICAgICAgICB0aGlzLnNlZ21lbnRTaXplID0gc2VnbWVudFNpemU7XG5cbiAgICAgICAgdGhpcy5fc2hpZnRSZWdpc3RlciA9IGNvZXJjZUFycmF5KGl2LCB0cnVlKTtcblxuICAgICAgICB0aGlzLl9hZXMgPSBuZXcgQUVTKGtleSk7XG4gICAgfVxuXG4gICAgTW9kZU9mT3BlcmF0aW9uQ0ZCLnByb3RvdHlwZS5lbmNyeXB0ID0gZnVuY3Rpb24ocGxhaW50ZXh0KSB7XG4gICAgICAgIGlmICgocGxhaW50ZXh0Lmxlbmd0aCAlIHRoaXMuc2VnbWVudFNpemUpICE9IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBwbGFpbnRleHQgc2l6ZSAobXVzdCBiZSBzZWdtZW50U2l6ZSBieXRlcyknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlbmNyeXB0ZWQgPSBjb2VyY2VBcnJheShwbGFpbnRleHQsIHRydWUpO1xuXG4gICAgICAgIHZhciB4b3JTZWdtZW50O1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVuY3J5cHRlZC5sZW5ndGg7IGkgKz0gdGhpcy5zZWdtZW50U2l6ZSkge1xuICAgICAgICAgICAgeG9yU2VnbWVudCA9IHRoaXMuX2Flcy5lbmNyeXB0KHRoaXMuX3NoaWZ0UmVnaXN0ZXIpO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLnNlZ21lbnRTaXplOyBqKyspIHtcbiAgICAgICAgICAgICAgICBlbmNyeXB0ZWRbaSArIGpdIF49IHhvclNlZ21lbnRbal07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNoaWZ0IHRoZSByZWdpc3RlclxuICAgICAgICAgICAgY29weUFycmF5KHRoaXMuX3NoaWZ0UmVnaXN0ZXIsIHRoaXMuX3NoaWZ0UmVnaXN0ZXIsIDAsIHRoaXMuc2VnbWVudFNpemUpO1xuICAgICAgICAgICAgY29weUFycmF5KGVuY3J5cHRlZCwgdGhpcy5fc2hpZnRSZWdpc3RlciwgMTYgLSB0aGlzLnNlZ21lbnRTaXplLCBpLCBpICsgdGhpcy5zZWdtZW50U2l6ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZW5jcnlwdGVkO1xuICAgIH1cblxuICAgIE1vZGVPZk9wZXJhdGlvbkNGQi5wcm90b3R5cGUuZGVjcnlwdCA9IGZ1bmN0aW9uKGNpcGhlcnRleHQpIHtcbiAgICAgICAgaWYgKChjaXBoZXJ0ZXh0Lmxlbmd0aCAlIHRoaXMuc2VnbWVudFNpemUpICE9IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBjaXBoZXJ0ZXh0IHNpemUgKG11c3QgYmUgc2VnbWVudFNpemUgYnl0ZXMpJyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcGxhaW50ZXh0ID0gY29lcmNlQXJyYXkoY2lwaGVydGV4dCwgdHJ1ZSk7XG5cbiAgICAgICAgdmFyIHhvclNlZ21lbnQ7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGxhaW50ZXh0Lmxlbmd0aDsgaSArPSB0aGlzLnNlZ21lbnRTaXplKSB7XG4gICAgICAgICAgICB4b3JTZWdtZW50ID0gdGhpcy5fYWVzLmVuY3J5cHQodGhpcy5fc2hpZnRSZWdpc3Rlcik7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5zZWdtZW50U2l6ZTsgaisrKSB7XG4gICAgICAgICAgICAgICAgcGxhaW50ZXh0W2kgKyBqXSBePSB4b3JTZWdtZW50W2pdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTaGlmdCB0aGUgcmVnaXN0ZXJcbiAgICAgICAgICAgIGNvcHlBcnJheSh0aGlzLl9zaGlmdFJlZ2lzdGVyLCB0aGlzLl9zaGlmdFJlZ2lzdGVyLCAwLCB0aGlzLnNlZ21lbnRTaXplKTtcbiAgICAgICAgICAgIGNvcHlBcnJheShjaXBoZXJ0ZXh0LCB0aGlzLl9zaGlmdFJlZ2lzdGVyLCAxNiAtIHRoaXMuc2VnbWVudFNpemUsIGksIGkgKyB0aGlzLnNlZ21lbnRTaXplKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwbGFpbnRleHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogIE1vZGUgT2YgT3BlcmF0aW9uIC0gT3V0cHV0IEZlZWRiYWNrIChPRkIpXG4gICAgICovXG4gICAgdmFyIE1vZGVPZk9wZXJhdGlvbk9GQiA9IGZ1bmN0aW9uKGtleSwgaXYpIHtcbiAgICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIE1vZGVPZk9wZXJhdGlvbk9GQikpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdBRVMgbXVzdCBiZSBpbnN0YW5pdGF0ZWQgd2l0aCBgbmV3YCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiT3V0cHV0IEZlZWRiYWNrXCI7XG4gICAgICAgIHRoaXMubmFtZSA9IFwib2ZiXCI7XG5cbiAgICAgICAgaWYgKCFpdikge1xuICAgICAgICAgICAgaXYgPSBjcmVhdGVBcnJheSgxNik7XG5cbiAgICAgICAgfSBlbHNlIGlmIChpdi5sZW5ndGggIT0gMTYpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBpbml0aWFsYXRpb24gdmVjdG9yIHNpemUgKG11c3QgYmUgMTYgYnl0ZXMpJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9sYXN0UHJlY2lwaGVyID0gY29lcmNlQXJyYXkoaXYsIHRydWUpO1xuICAgICAgICB0aGlzLl9sYXN0UHJlY2lwaGVySW5kZXggPSAxNjtcblxuICAgICAgICB0aGlzLl9hZXMgPSBuZXcgQUVTKGtleSk7XG4gICAgfVxuXG4gICAgTW9kZU9mT3BlcmF0aW9uT0ZCLnByb3RvdHlwZS5lbmNyeXB0ID0gZnVuY3Rpb24ocGxhaW50ZXh0KSB7XG4gICAgICAgIHZhciBlbmNyeXB0ZWQgPSBjb2VyY2VBcnJheShwbGFpbnRleHQsIHRydWUpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW5jcnlwdGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fbGFzdFByZWNpcGhlckluZGV4ID09PSAxNikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xhc3RQcmVjaXBoZXIgPSB0aGlzLl9hZXMuZW5jcnlwdCh0aGlzLl9sYXN0UHJlY2lwaGVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9sYXN0UHJlY2lwaGVySW5kZXggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZW5jcnlwdGVkW2ldIF49IHRoaXMuX2xhc3RQcmVjaXBoZXJbdGhpcy5fbGFzdFByZWNpcGhlckluZGV4KytdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVuY3J5cHRlZDtcbiAgICB9XG5cbiAgICAvLyBEZWNyeXB0aW9uIGlzIHN5bWV0cmljXG4gICAgTW9kZU9mT3BlcmF0aW9uT0ZCLnByb3RvdHlwZS5kZWNyeXB0ID0gTW9kZU9mT3BlcmF0aW9uT0ZCLnByb3RvdHlwZS5lbmNyeXB0O1xuXG5cbiAgICAvKipcbiAgICAgKiAgQ291bnRlciBvYmplY3QgZm9yIENUUiBjb21tb24gbW9kZSBvZiBvcGVyYXRpb25cbiAgICAgKi9cbiAgICB2YXIgQ291bnRlciA9IGZ1bmN0aW9uKGluaXRpYWxWYWx1ZSkge1xuICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQ291bnRlcikpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdDb3VudGVyIG11c3QgYmUgaW5zdGFuaXRhdGVkIHdpdGggYG5ld2AnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIGFsbG93IDAsIGJ1dCBhbnl0aGluZyBmYWxzZS1pc2ggdXNlcyB0aGUgZGVmYXVsdCAxXG4gICAgICAgIGlmIChpbml0aWFsVmFsdWUgIT09IDAgJiYgIWluaXRpYWxWYWx1ZSkgeyBpbml0aWFsVmFsdWUgPSAxOyB9XG5cbiAgICAgICAgaWYgKHR5cGVvZihpbml0aWFsVmFsdWUpID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgdGhpcy5fY291bnRlciA9IGNyZWF0ZUFycmF5KDE2KTtcbiAgICAgICAgICAgIHRoaXMuc2V0VmFsdWUoaW5pdGlhbFZhbHVlKTtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXRCeXRlcyhpbml0aWFsVmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgQ291bnRlci5wcm90b3R5cGUuc2V0VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAodHlwZW9mKHZhbHVlKSAhPT0gJ251bWJlcicgfHwgcGFyc2VJbnQodmFsdWUpICE9IHZhbHVlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgY291bnRlciB2YWx1ZSAobXVzdCBiZSBhbiBpbnRlZ2VyKScpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2UgY2Fubm90IHNhZmVseSBoYW5kbGUgbnVtYmVycyBiZXlvbmQgdGhlIHNhZmUgcmFuZ2UgZm9yIGludGVnZXJzXG4gICAgICAgIGlmICh2YWx1ZSA+IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludGVnZXIgdmFsdWUgb3V0IG9mIHNhZmUgcmFuZ2UnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGluZGV4ID0gMTU7IGluZGV4ID49IDA7IC0taW5kZXgpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvdW50ZXJbaW5kZXhdID0gdmFsdWUgJSAyNTY7XG4gICAgICAgICAgICB2YWx1ZSA9IHBhcnNlSW50KHZhbHVlIC8gMjU2KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIENvdW50ZXIucHJvdG90eXBlLnNldEJ5dGVzID0gZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICAgICAgYnl0ZXMgPSBjb2VyY2VBcnJheShieXRlcywgdHJ1ZSk7XG5cbiAgICAgICAgaWYgKGJ5dGVzLmxlbmd0aCAhPSAxNikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIGNvdW50ZXIgYnl0ZXMgc2l6ZSAobXVzdCBiZSAxNiBieXRlcyknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvdW50ZXIgPSBieXRlcztcbiAgICB9O1xuXG4gICAgQ291bnRlci5wcm90b3R5cGUuaW5jcmVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxNTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9jb3VudGVyW2ldID09PSAyNTUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jb3VudGVyW2ldID0gMDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY291bnRlcltpXSsrO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiAgTW9kZSBPZiBPcGVyYXRpb24gLSBDb3VudGVyIChDVFIpXG4gICAgICovXG4gICAgdmFyIE1vZGVPZk9wZXJhdGlvbkNUUiA9IGZ1bmN0aW9uKGtleSwgY291bnRlcikge1xuICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTW9kZU9mT3BlcmF0aW9uQ1RSKSkge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0FFUyBtdXN0IGJlIGluc3Rhbml0YXRlZCB3aXRoIGBuZXdgJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJDb3VudGVyXCI7XG4gICAgICAgIHRoaXMubmFtZSA9IFwiY3RyXCI7XG5cbiAgICAgICAgaWYgKCEoY291bnRlciBpbnN0YW5jZW9mIENvdW50ZXIpKSB7XG4gICAgICAgICAgICBjb3VudGVyID0gbmV3IENvdW50ZXIoY291bnRlcilcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvdW50ZXIgPSBjb3VudGVyO1xuXG4gICAgICAgIHRoaXMuX3JlbWFpbmluZ0NvdW50ZXIgPSBudWxsO1xuICAgICAgICB0aGlzLl9yZW1haW5pbmdDb3VudGVySW5kZXggPSAxNjtcblxuICAgICAgICB0aGlzLl9hZXMgPSBuZXcgQUVTKGtleSk7XG4gICAgfVxuXG4gICAgTW9kZU9mT3BlcmF0aW9uQ1RSLnByb3RvdHlwZS5lbmNyeXB0ID0gZnVuY3Rpb24ocGxhaW50ZXh0KSB7XG4gICAgICAgIHZhciBlbmNyeXB0ZWQgPSBjb2VyY2VBcnJheShwbGFpbnRleHQsIHRydWUpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW5jcnlwdGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fcmVtYWluaW5nQ291bnRlckluZGV4ID09PSAxNikge1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbWFpbmluZ0NvdW50ZXIgPSB0aGlzLl9hZXMuZW5jcnlwdCh0aGlzLl9jb3VudGVyLl9jb3VudGVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1haW5pbmdDb3VudGVySW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvdW50ZXIuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbmNyeXB0ZWRbaV0gXj0gdGhpcy5fcmVtYWluaW5nQ291bnRlclt0aGlzLl9yZW1haW5pbmdDb3VudGVySW5kZXgrK107XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZW5jcnlwdGVkO1xuICAgIH1cblxuICAgIC8vIERlY3J5cHRpb24gaXMgc3ltZXRyaWNcbiAgICBNb2RlT2ZPcGVyYXRpb25DVFIucHJvdG90eXBlLmRlY3J5cHQgPSBNb2RlT2ZPcGVyYXRpb25DVFIucHJvdG90eXBlLmVuY3J5cHQ7XG5cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gUGFkZGluZ1xuXG4gICAgLy8gU2VlOmh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMyMzE1XG4gICAgZnVuY3Rpb24gcGtjczdwYWQoZGF0YSkge1xuICAgICAgICBkYXRhID0gY29lcmNlQXJyYXkoZGF0YSwgdHJ1ZSk7XG4gICAgICAgIHZhciBwYWRkZXIgPSAxNiAtIChkYXRhLmxlbmd0aCAlIDE2KTtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGNyZWF0ZUFycmF5KGRhdGEubGVuZ3RoICsgcGFkZGVyKTtcbiAgICAgICAgY29weUFycmF5KGRhdGEsIHJlc3VsdCk7XG4gICAgICAgIGZvciAodmFyIGkgPSBkYXRhLmxlbmd0aDsgaSA8IHJlc3VsdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcmVzdWx0W2ldID0gcGFkZGVyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGtjczdzdHJpcChkYXRhKSB7XG4gICAgICAgIGRhdGEgPSBjb2VyY2VBcnJheShkYXRhLCB0cnVlKTtcbiAgICAgICAgaWYgKGRhdGEubGVuZ3RoIDwgMTYpIHsgdGhyb3cgbmV3IEVycm9yKCdQS0NTIzcgaW52YWxpZCBsZW5ndGgnKTsgfVxuXG4gICAgICAgIHZhciBwYWRkZXIgPSBkYXRhW2RhdGEubGVuZ3RoIC0gMV07XG4gICAgICAgIGlmIChwYWRkZXIgPiAxNikgeyB0aHJvdyBuZXcgRXJyb3IoJ1BLQ1MjNyBwYWRkaW5nIGJ5dGUgb3V0IG9mIHJhbmdlJyk7IH1cblxuICAgICAgICB2YXIgbGVuZ3RoID0gZGF0YS5sZW5ndGggLSBwYWRkZXI7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFkZGVyOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChkYXRhW2xlbmd0aCArIGldICE9PSBwYWRkZXIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BLQ1MjNyBpbnZhbGlkIHBhZGRpbmcgYnl0ZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlc3VsdCA9IGNyZWF0ZUFycmF5KGxlbmd0aCk7XG4gICAgICAgIGNvcHlBcnJheShkYXRhLCByZXN1bHQsIDAsIDAsIGxlbmd0aCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBFeHBvcnRpbmdcblxuXG4gICAgLy8gVGhlIGJsb2NrIGNpcGhlclxuICAgIHZhciBhZXNqcyA9IHtcbiAgICAgICAgQUVTOiBBRVMsXG4gICAgICAgIENvdW50ZXI6IENvdW50ZXIsXG5cbiAgICAgICAgTW9kZU9mT3BlcmF0aW9uOiB7XG4gICAgICAgICAgICBlY2I6IE1vZGVPZk9wZXJhdGlvbkVDQixcbiAgICAgICAgICAgIGNiYzogTW9kZU9mT3BlcmF0aW9uQ0JDLFxuICAgICAgICAgICAgY2ZiOiBNb2RlT2ZPcGVyYXRpb25DRkIsXG4gICAgICAgICAgICBvZmI6IE1vZGVPZk9wZXJhdGlvbk9GQixcbiAgICAgICAgICAgIGN0cjogTW9kZU9mT3BlcmF0aW9uQ1RSXG4gICAgICAgIH0sXG5cbiAgICAgICAgdXRpbHM6IHtcbiAgICAgICAgICAgIGhleDogY29udmVydEhleCxcbiAgICAgICAgICAgIHV0Zjg6IGNvbnZlcnRVdGY4XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFkZGluZzoge1xuICAgICAgICAgICAgcGtjczc6IHtcbiAgICAgICAgICAgICAgICBwYWQ6IHBrY3M3cGFkLFxuICAgICAgICAgICAgICAgIHN0cmlwOiBwa2NzN3N0cmlwXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2FycmF5VGVzdDoge1xuICAgICAgICAgICAgY29lcmNlQXJyYXk6IGNvZXJjZUFycmF5LFxuICAgICAgICAgICAgY3JlYXRlQXJyYXk6IGNyZWF0ZUFycmF5LFxuICAgICAgICAgICAgY29weUFycmF5OiBjb3B5QXJyYXksXG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvLyBub2RlLmpzXG4gICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGFlc2pzXG5cbiAgICAvLyBSZXF1aXJlSlMvQU1EXG4gICAgLy8gaHR0cDovL3d3dy5yZXF1aXJlanMub3JnL2RvY3MvYXBpLmh0bWxcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW1kanMvYW1kanMtYXBpL3dpa2kvQU1EXG4gICAgfSBlbHNlIGlmICh0eXBlb2YoZGVmaW5lKSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbXSwgZnVuY3Rpb24oKSB7IHJldHVybiBhZXNqczsgfSk7XG5cbiAgICAvLyBXZWIgQnJvd3NlcnNcbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vIElmIHRoZXJlIHdhcyBhbiBleGlzdGluZyBsaWJyYXJ5IGF0IFwiYWVzanNcIiBtYWtlIHN1cmUgaXQncyBzdGlsbCBhdmFpbGFibGVcbiAgICAgICAgaWYgKHJvb3QuYWVzanMpIHtcbiAgICAgICAgICAgIGFlc2pzLl9hZXNqcyA9IHJvb3QuYWVzanM7XG4gICAgICAgIH1cblxuICAgICAgICByb290LmFlc2pzID0gYWVzanM7XG4gICAgfVxuXG5cbn0pKHRoaXMpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vIHJhd0FzYXAgcHJvdmlkZXMgZXZlcnl0aGluZyB3ZSBuZWVkIGV4Y2VwdCBleGNlcHRpb24gbWFuYWdlbWVudC5cbnZhciByYXdBc2FwID0gcmVxdWlyZShcIi4vcmF3XCIpO1xuLy8gUmF3VGFza3MgYXJlIHJlY3ljbGVkIHRvIHJlZHVjZSBHQyBjaHVybi5cbnZhciBmcmVlVGFza3MgPSBbXTtcbi8vIFdlIHF1ZXVlIGVycm9ycyB0byBlbnN1cmUgdGhleSBhcmUgdGhyb3duIGluIHJpZ2h0IG9yZGVyIChGSUZPKS5cbi8vIEFycmF5LWFzLXF1ZXVlIGlzIGdvb2QgZW5vdWdoIGhlcmUsIHNpbmNlIHdlIGFyZSBqdXN0IGRlYWxpbmcgd2l0aCBleGNlcHRpb25zLlxudmFyIHBlbmRpbmdFcnJvcnMgPSBbXTtcbnZhciByZXF1ZXN0RXJyb3JUaHJvdyA9IHJhd0FzYXAubWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyKHRocm93Rmlyc3RFcnJvcik7XG5cbmZ1bmN0aW9uIHRocm93Rmlyc3RFcnJvcigpIHtcbiAgICBpZiAocGVuZGluZ0Vycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgcGVuZGluZ0Vycm9ycy5zaGlmdCgpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBDYWxscyBhIHRhc2sgYXMgc29vbiBhcyBwb3NzaWJsZSBhZnRlciByZXR1cm5pbmcsIGluIGl0cyBvd24gZXZlbnQsIHdpdGggcHJpb3JpdHlcbiAqIG92ZXIgb3RoZXIgZXZlbnRzIGxpa2UgYW5pbWF0aW9uLCByZWZsb3csIGFuZCByZXBhaW50LiBBbiBlcnJvciB0aHJvd24gZnJvbSBhblxuICogZXZlbnQgd2lsbCBub3QgaW50ZXJydXB0LCBub3IgZXZlbiBzdWJzdGFudGlhbGx5IHNsb3cgZG93biB0aGUgcHJvY2Vzc2luZyBvZlxuICogb3RoZXIgZXZlbnRzLCBidXQgd2lsbCBiZSByYXRoZXIgcG9zdHBvbmVkIHRvIGEgbG93ZXIgcHJpb3JpdHkgZXZlbnQuXG4gKiBAcGFyYW0ge3tjYWxsfX0gdGFzayBBIGNhbGxhYmxlIG9iamVjdCwgdHlwaWNhbGx5IGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBub1xuICogYXJndW1lbnRzLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGFzYXA7XG5mdW5jdGlvbiBhc2FwKHRhc2spIHtcbiAgICB2YXIgcmF3VGFzaztcbiAgICBpZiAoZnJlZVRhc2tzLmxlbmd0aCkge1xuICAgICAgICByYXdUYXNrID0gZnJlZVRhc2tzLnBvcCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJhd1Rhc2sgPSBuZXcgUmF3VGFzaygpO1xuICAgIH1cbiAgICByYXdUYXNrLnRhc2sgPSB0YXNrO1xuICAgIHJhd0FzYXAocmF3VGFzayk7XG59XG5cbi8vIFdlIHdyYXAgdGFza3Mgd2l0aCByZWN5Y2xhYmxlIHRhc2sgb2JqZWN0cy4gIEEgdGFzayBvYmplY3QgaW1wbGVtZW50c1xuLy8gYGNhbGxgLCBqdXN0IGxpa2UgYSBmdW5jdGlvbi5cbmZ1bmN0aW9uIFJhd1Rhc2soKSB7XG4gICAgdGhpcy50YXNrID0gbnVsbDtcbn1cblxuLy8gVGhlIHNvbGUgcHVycG9zZSBvZiB3cmFwcGluZyB0aGUgdGFzayBpcyB0byBjYXRjaCB0aGUgZXhjZXB0aW9uIGFuZCByZWN5Y2xlXG4vLyB0aGUgdGFzayBvYmplY3QgYWZ0ZXIgaXRzIHNpbmdsZSB1c2UuXG5SYXdUYXNrLnByb3RvdHlwZS5jYWxsID0gZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIHRoaXMudGFzay5jYWxsKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgaWYgKGFzYXAub25lcnJvcikge1xuICAgICAgICAgICAgLy8gVGhpcyBob29rIGV4aXN0cyBwdXJlbHkgZm9yIHRlc3RpbmcgcHVycG9zZXMuXG4gICAgICAgICAgICAvLyBJdHMgbmFtZSB3aWxsIGJlIHBlcmlvZGljYWxseSByYW5kb21pemVkIHRvIGJyZWFrIGFueSBjb2RlIHRoYXRcbiAgICAgICAgICAgIC8vIGRlcGVuZHMgb24gaXRzIGV4aXN0ZW5jZS5cbiAgICAgICAgICAgIGFzYXAub25lcnJvcihlcnJvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBJbiBhIHdlYiBicm93c2VyLCBleGNlcHRpb25zIGFyZSBub3QgZmF0YWwuIEhvd2V2ZXIsIHRvIGF2b2lkXG4gICAgICAgICAgICAvLyBzbG93aW5nIGRvd24gdGhlIHF1ZXVlIG9mIHBlbmRpbmcgdGFza3MsIHdlIHJldGhyb3cgdGhlIGVycm9yIGluIGFcbiAgICAgICAgICAgIC8vIGxvd2VyIHByaW9yaXR5IHR1cm4uXG4gICAgICAgICAgICBwZW5kaW5nRXJyb3JzLnB1c2goZXJyb3IpO1xuICAgICAgICAgICAgcmVxdWVzdEVycm9yVGhyb3coKTtcbiAgICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICAgIHRoaXMudGFzayA9IG51bGw7XG4gICAgICAgIGZyZWVUYXNrc1tmcmVlVGFza3MubGVuZ3RoXSA9IHRoaXM7XG4gICAgfVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG4vLyBVc2UgdGhlIGZhc3Rlc3QgbWVhbnMgcG9zc2libGUgdG8gZXhlY3V0ZSBhIHRhc2sgaW4gaXRzIG93biB0dXJuLCB3aXRoXG4vLyBwcmlvcml0eSBvdmVyIG90aGVyIGV2ZW50cyBpbmNsdWRpbmcgSU8sIGFuaW1hdGlvbiwgcmVmbG93LCBhbmQgcmVkcmF3XG4vLyBldmVudHMgaW4gYnJvd3NlcnMuXG4vL1xuLy8gQW4gZXhjZXB0aW9uIHRocm93biBieSBhIHRhc2sgd2lsbCBwZXJtYW5lbnRseSBpbnRlcnJ1cHQgdGhlIHByb2Nlc3Npbmcgb2Zcbi8vIHN1YnNlcXVlbnQgdGFza3MuIFRoZSBoaWdoZXIgbGV2ZWwgYGFzYXBgIGZ1bmN0aW9uIGVuc3VyZXMgdGhhdCBpZiBhblxuLy8gZXhjZXB0aW9uIGlzIHRocm93biBieSBhIHRhc2ssIHRoYXQgdGhlIHRhc2sgcXVldWUgd2lsbCBjb250aW51ZSBmbHVzaGluZyBhc1xuLy8gc29vbiBhcyBwb3NzaWJsZSwgYnV0IGlmIHlvdSB1c2UgYHJhd0FzYXBgIGRpcmVjdGx5LCB5b3UgYXJlIHJlc3BvbnNpYmxlIHRvXG4vLyBlaXRoZXIgZW5zdXJlIHRoYXQgbm8gZXhjZXB0aW9ucyBhcmUgdGhyb3duIGZyb20geW91ciB0YXNrLCBvciB0byBtYW51YWxseVxuLy8gY2FsbCBgcmF3QXNhcC5yZXF1ZXN0Rmx1c2hgIGlmIGFuIGV4Y2VwdGlvbiBpcyB0aHJvd24uXG5tb2R1bGUuZXhwb3J0cyA9IHJhd0FzYXA7XG5mdW5jdGlvbiByYXdBc2FwKHRhc2spIHtcbiAgICBpZiAoIXF1ZXVlLmxlbmd0aCkge1xuICAgICAgICByZXF1ZXN0Rmx1c2goKTtcbiAgICAgICAgZmx1c2hpbmcgPSB0cnVlO1xuICAgIH1cbiAgICAvLyBFcXVpdmFsZW50IHRvIHB1c2gsIGJ1dCBhdm9pZHMgYSBmdW5jdGlvbiBjYWxsLlxuICAgIHF1ZXVlW3F1ZXVlLmxlbmd0aF0gPSB0YXNrO1xufVxuXG52YXIgcXVldWUgPSBbXTtcbi8vIE9uY2UgYSBmbHVzaCBoYXMgYmVlbiByZXF1ZXN0ZWQsIG5vIGZ1cnRoZXIgY2FsbHMgdG8gYHJlcXVlc3RGbHVzaGAgYXJlXG4vLyBuZWNlc3NhcnkgdW50aWwgdGhlIG5leHQgYGZsdXNoYCBjb21wbGV0ZXMuXG52YXIgZmx1c2hpbmcgPSBmYWxzZTtcbi8vIGByZXF1ZXN0Rmx1c2hgIGlzIGFuIGltcGxlbWVudGF0aW9uLXNwZWNpZmljIG1ldGhvZCB0aGF0IGF0dGVtcHRzIHRvIGtpY2tcbi8vIG9mZiBhIGBmbHVzaGAgZXZlbnQgYXMgcXVpY2tseSBhcyBwb3NzaWJsZS4gYGZsdXNoYCB3aWxsIGF0dGVtcHQgdG8gZXhoYXVzdFxuLy8gdGhlIGV2ZW50IHF1ZXVlIGJlZm9yZSB5aWVsZGluZyB0byB0aGUgYnJvd3NlcidzIG93biBldmVudCBsb29wLlxudmFyIHJlcXVlc3RGbHVzaDtcbi8vIFRoZSBwb3NpdGlvbiBvZiB0aGUgbmV4dCB0YXNrIHRvIGV4ZWN1dGUgaW4gdGhlIHRhc2sgcXVldWUuIFRoaXMgaXNcbi8vIHByZXNlcnZlZCBiZXR3ZWVuIGNhbGxzIHRvIGBmbHVzaGAgc28gdGhhdCBpdCBjYW4gYmUgcmVzdW1lZCBpZlxuLy8gYSB0YXNrIHRocm93cyBhbiBleGNlcHRpb24uXG52YXIgaW5kZXggPSAwO1xuLy8gSWYgYSB0YXNrIHNjaGVkdWxlcyBhZGRpdGlvbmFsIHRhc2tzIHJlY3Vyc2l2ZWx5LCB0aGUgdGFzayBxdWV1ZSBjYW4gZ3Jvd1xuLy8gdW5ib3VuZGVkLiBUbyBwcmV2ZW50IG1lbW9yeSBleGhhdXN0aW9uLCB0aGUgdGFzayBxdWV1ZSB3aWxsIHBlcmlvZGljYWxseVxuLy8gdHJ1bmNhdGUgYWxyZWFkeS1jb21wbGV0ZWQgdGFza3MuXG52YXIgY2FwYWNpdHkgPSAxMDI0O1xuXG4vLyBUaGUgZmx1c2ggZnVuY3Rpb24gcHJvY2Vzc2VzIGFsbCB0YXNrcyB0aGF0IGhhdmUgYmVlbiBzY2hlZHVsZWQgd2l0aFxuLy8gYHJhd0FzYXBgIHVubGVzcyBhbmQgdW50aWwgb25lIG9mIHRob3NlIHRhc2tzIHRocm93cyBhbiBleGNlcHRpb24uXG4vLyBJZiBhIHRhc2sgdGhyb3dzIGFuIGV4Y2VwdGlvbiwgYGZsdXNoYCBlbnN1cmVzIHRoYXQgaXRzIHN0YXRlIHdpbGwgcmVtYWluXG4vLyBjb25zaXN0ZW50IGFuZCB3aWxsIHJlc3VtZSB3aGVyZSBpdCBsZWZ0IG9mZiB3aGVuIGNhbGxlZCBhZ2Fpbi5cbi8vIEhvd2V2ZXIsIGBmbHVzaGAgZG9lcyBub3QgbWFrZSBhbnkgYXJyYW5nZW1lbnRzIHRvIGJlIGNhbGxlZCBhZ2FpbiBpZiBhblxuLy8gZXhjZXB0aW9uIGlzIHRocm93bi5cbmZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIHdoaWxlIChpbmRleCA8IHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICB2YXIgY3VycmVudEluZGV4ID0gaW5kZXg7XG4gICAgICAgIC8vIEFkdmFuY2UgdGhlIGluZGV4IGJlZm9yZSBjYWxsaW5nIHRoZSB0YXNrLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSB3aWxsXG4gICAgICAgIC8vIGJlZ2luIGZsdXNoaW5nIG9uIHRoZSBuZXh0IHRhc2sgdGhlIHRhc2sgdGhyb3dzIGFuIGVycm9yLlxuICAgICAgICBpbmRleCA9IGluZGV4ICsgMTtcbiAgICAgICAgcXVldWVbY3VycmVudEluZGV4XS5jYWxsKCk7XG4gICAgICAgIC8vIFByZXZlbnQgbGVha2luZyBtZW1vcnkgZm9yIGxvbmcgY2hhaW5zIG9mIHJlY3Vyc2l2ZSBjYWxscyB0byBgYXNhcGAuXG4gICAgICAgIC8vIElmIHdlIGNhbGwgYGFzYXBgIHdpdGhpbiB0YXNrcyBzY2hlZHVsZWQgYnkgYGFzYXBgLCB0aGUgcXVldWUgd2lsbFxuICAgICAgICAvLyBncm93LCBidXQgdG8gYXZvaWQgYW4gTyhuKSB3YWxrIGZvciBldmVyeSB0YXNrIHdlIGV4ZWN1dGUsIHdlIGRvbid0XG4gICAgICAgIC8vIHNoaWZ0IHRhc2tzIG9mZiB0aGUgcXVldWUgYWZ0ZXIgdGhleSBoYXZlIGJlZW4gZXhlY3V0ZWQuXG4gICAgICAgIC8vIEluc3RlYWQsIHdlIHBlcmlvZGljYWxseSBzaGlmdCAxMDI0IHRhc2tzIG9mZiB0aGUgcXVldWUuXG4gICAgICAgIGlmIChpbmRleCA+IGNhcGFjaXR5KSB7XG4gICAgICAgICAgICAvLyBNYW51YWxseSBzaGlmdCBhbGwgdmFsdWVzIHN0YXJ0aW5nIGF0IHRoZSBpbmRleCBiYWNrIHRvIHRoZVxuICAgICAgICAgICAgLy8gYmVnaW5uaW5nIG9mIHRoZSBxdWV1ZS5cbiAgICAgICAgICAgIGZvciAodmFyIHNjYW4gPSAwLCBuZXdMZW5ndGggPSBxdWV1ZS5sZW5ndGggLSBpbmRleDsgc2NhbiA8IG5ld0xlbmd0aDsgc2NhbisrKSB7XG4gICAgICAgICAgICAgICAgcXVldWVbc2Nhbl0gPSBxdWV1ZVtzY2FuICsgaW5kZXhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcXVldWUubGVuZ3RoIC09IGluZGV4O1xuICAgICAgICAgICAgaW5kZXggPSAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLmxlbmd0aCA9IDA7XG4gICAgaW5kZXggPSAwO1xuICAgIGZsdXNoaW5nID0gZmFsc2U7XG59XG5cbi8vIGByZXF1ZXN0Rmx1c2hgIGlzIGltcGxlbWVudGVkIHVzaW5nIGEgc3RyYXRlZ3kgYmFzZWQgb24gZGF0YSBjb2xsZWN0ZWQgZnJvbVxuLy8gZXZlcnkgYXZhaWxhYmxlIFNhdWNlTGFicyBTZWxlbml1bSB3ZWIgZHJpdmVyIHdvcmtlciBhdCB0aW1lIG9mIHdyaXRpbmcuXG4vLyBodHRwczovL2RvY3MuZ29vZ2xlLmNvbS9zcHJlYWRzaGVldHMvZC8xbUctNVVZR3VwNXF4R2RFTVdraFA2QldDejA1M05VYjJFMVFvVVRVMTZ1QS9lZGl0I2dpZD03ODM3MjQ1OTNcblxuLy8gU2FmYXJpIDYgYW5kIDYuMSBmb3IgZGVza3RvcCwgaVBhZCwgYW5kIGlQaG9uZSBhcmUgdGhlIG9ubHkgYnJvd3NlcnMgdGhhdFxuLy8gaGF2ZSBXZWJLaXRNdXRhdGlvbk9ic2VydmVyIGJ1dCBub3QgdW4tcHJlZml4ZWQgTXV0YXRpb25PYnNlcnZlci5cbi8vIE11c3QgdXNlIGBnbG9iYWxgIG9yIGBzZWxmYCBpbnN0ZWFkIG9mIGB3aW5kb3dgIHRvIHdvcmsgaW4gYm90aCBmcmFtZXMgYW5kIHdlYlxuLy8gd29ya2Vycy4gYGdsb2JhbGAgaXMgYSBwcm92aXNpb24gb2YgQnJvd3NlcmlmeSwgTXIsIE1ycywgb3IgTW9wLlxuXG4vKiBnbG9iYWxzIHNlbGYgKi9cbnZhciBzY29wZSA9IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiBzZWxmO1xudmFyIEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID0gc2NvcGUuTXV0YXRpb25PYnNlcnZlciB8fCBzY29wZS5XZWJLaXRNdXRhdGlvbk9ic2VydmVyO1xuXG4vLyBNdXRhdGlvbk9ic2VydmVycyBhcmUgZGVzaXJhYmxlIGJlY2F1c2UgdGhleSBoYXZlIGhpZ2ggcHJpb3JpdHkgYW5kIHdvcmtcbi8vIHJlbGlhYmx5IGV2ZXJ5d2hlcmUgdGhleSBhcmUgaW1wbGVtZW50ZWQuXG4vLyBUaGV5IGFyZSBpbXBsZW1lbnRlZCBpbiBhbGwgbW9kZXJuIGJyb3dzZXJzLlxuLy9cbi8vIC0gQW5kcm9pZCA0LTQuM1xuLy8gLSBDaHJvbWUgMjYtMzRcbi8vIC0gRmlyZWZveCAxNC0yOVxuLy8gLSBJbnRlcm5ldCBFeHBsb3JlciAxMVxuLy8gLSBpUGFkIFNhZmFyaSA2LTcuMVxuLy8gLSBpUGhvbmUgU2FmYXJpIDctNy4xXG4vLyAtIFNhZmFyaSA2LTdcbmlmICh0eXBlb2YgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHJlcXVlc3RGbHVzaCA9IG1ha2VSZXF1ZXN0Q2FsbEZyb21NdXRhdGlvbk9ic2VydmVyKGZsdXNoKTtcblxuLy8gTWVzc2FnZUNoYW5uZWxzIGFyZSBkZXNpcmFibGUgYmVjYXVzZSB0aGV5IGdpdmUgZGlyZWN0IGFjY2VzcyB0byB0aGUgSFRNTFxuLy8gdGFzayBxdWV1ZSwgYXJlIGltcGxlbWVudGVkIGluIEludGVybmV0IEV4cGxvcmVyIDEwLCBTYWZhcmkgNS4wLTEsIGFuZCBPcGVyYVxuLy8gMTEtMTIsIGFuZCBpbiB3ZWIgd29ya2VycyBpbiBtYW55IGVuZ2luZXMuXG4vLyBBbHRob3VnaCBtZXNzYWdlIGNoYW5uZWxzIHlpZWxkIHRvIGFueSBxdWV1ZWQgcmVuZGVyaW5nIGFuZCBJTyB0YXNrcywgdGhleVxuLy8gd291bGQgYmUgYmV0dGVyIHRoYW4gaW1wb3NpbmcgdGhlIDRtcyBkZWxheSBvZiB0aW1lcnMuXG4vLyBIb3dldmVyLCB0aGV5IGRvIG5vdCB3b3JrIHJlbGlhYmx5IGluIEludGVybmV0IEV4cGxvcmVyIG9yIFNhZmFyaS5cblxuLy8gSW50ZXJuZXQgRXhwbG9yZXIgMTAgaXMgdGhlIG9ubHkgYnJvd3NlciB0aGF0IGhhcyBzZXRJbW1lZGlhdGUgYnV0IGRvZXNcbi8vIG5vdCBoYXZlIE11dGF0aW9uT2JzZXJ2ZXJzLlxuLy8gQWx0aG91Z2ggc2V0SW1tZWRpYXRlIHlpZWxkcyB0byB0aGUgYnJvd3NlcidzIHJlbmRlcmVyLCBpdCB3b3VsZCBiZVxuLy8gcHJlZmVycmFibGUgdG8gZmFsbGluZyBiYWNrIHRvIHNldFRpbWVvdXQgc2luY2UgaXQgZG9lcyBub3QgaGF2ZVxuLy8gdGhlIG1pbmltdW0gNG1zIHBlbmFsdHkuXG4vLyBVbmZvcnR1bmF0ZWx5IHRoZXJlIGFwcGVhcnMgdG8gYmUgYSBidWcgaW4gSW50ZXJuZXQgRXhwbG9yZXIgMTAgTW9iaWxlIChhbmRcbi8vIERlc2t0b3AgdG8gYSBsZXNzZXIgZXh0ZW50KSB0aGF0IHJlbmRlcnMgYm90aCBzZXRJbW1lZGlhdGUgYW5kXG4vLyBNZXNzYWdlQ2hhbm5lbCB1c2VsZXNzIGZvciB0aGUgcHVycG9zZXMgb2YgQVNBUC5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9rcmlza293YWwvcS9pc3N1ZXMvMzk2XG5cbi8vIFRpbWVycyBhcmUgaW1wbGVtZW50ZWQgdW5pdmVyc2FsbHkuXG4vLyBXZSBmYWxsIGJhY2sgdG8gdGltZXJzIGluIHdvcmtlcnMgaW4gbW9zdCBlbmdpbmVzLCBhbmQgaW4gZm9yZWdyb3VuZFxuLy8gY29udGV4dHMgaW4gdGhlIGZvbGxvd2luZyBicm93c2Vycy5cbi8vIEhvd2V2ZXIsIG5vdGUgdGhhdCBldmVuIHRoaXMgc2ltcGxlIGNhc2UgcmVxdWlyZXMgbnVhbmNlcyB0byBvcGVyYXRlIGluIGFcbi8vIGJyb2FkIHNwZWN0cnVtIG9mIGJyb3dzZXJzLlxuLy9cbi8vIC0gRmlyZWZveCAzLTEzXG4vLyAtIEludGVybmV0IEV4cGxvcmVyIDYtOVxuLy8gLSBpUGFkIFNhZmFyaSA0LjNcbi8vIC0gTHlueCAyLjguN1xufSBlbHNlIHtcbiAgICByZXF1ZXN0Rmx1c2ggPSBtYWtlUmVxdWVzdENhbGxGcm9tVGltZXIoZmx1c2gpO1xufVxuXG4vLyBgcmVxdWVzdEZsdXNoYCByZXF1ZXN0cyB0aGF0IHRoZSBoaWdoIHByaW9yaXR5IGV2ZW50IHF1ZXVlIGJlIGZsdXNoZWQgYXNcbi8vIHNvb24gYXMgcG9zc2libGUuXG4vLyBUaGlzIGlzIHVzZWZ1bCB0byBwcmV2ZW50IGFuIGVycm9yIHRocm93biBpbiBhIHRhc2sgZnJvbSBzdGFsbGluZyB0aGUgZXZlbnRcbi8vIHF1ZXVlIGlmIHRoZSBleGNlcHRpb24gaGFuZGxlZCBieSBOb2RlLmpz4oCZc1xuLy8gYHByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiKWAgb3IgYnkgYSBkb21haW4uXG5yYXdBc2FwLnJlcXVlc3RGbHVzaCA9IHJlcXVlc3RGbHVzaDtcblxuLy8gVG8gcmVxdWVzdCBhIGhpZ2ggcHJpb3JpdHkgZXZlbnQsIHdlIGluZHVjZSBhIG11dGF0aW9uIG9ic2VydmVyIGJ5IHRvZ2dsaW5nXG4vLyB0aGUgdGV4dCBvZiBhIHRleHQgbm9kZSBiZXR3ZWVuIFwiMVwiIGFuZCBcIi0xXCIuXG5mdW5jdGlvbiBtYWtlUmVxdWVzdENhbGxGcm9tTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjaykge1xuICAgIHZhciB0b2dnbGUgPSAxO1xuICAgIHZhciBvYnNlcnZlciA9IG5ldyBCcm93c2VyTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjayk7XG4gICAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHtjaGFyYWN0ZXJEYXRhOiB0cnVlfSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuICAgICAgICB0b2dnbGUgPSAtdG9nZ2xlO1xuICAgICAgICBub2RlLmRhdGEgPSB0b2dnbGU7XG4gICAgfTtcbn1cblxuLy8gVGhlIG1lc3NhZ2UgY2hhbm5lbCB0ZWNobmlxdWUgd2FzIGRpc2NvdmVyZWQgYnkgTWFsdGUgVWJsIGFuZCB3YXMgdGhlXG4vLyBvcmlnaW5hbCBmb3VuZGF0aW9uIGZvciB0aGlzIGxpYnJhcnkuXG4vLyBodHRwOi8vd3d3Lm5vbmJsb2NraW5nLmlvLzIwMTEvMDYvd2luZG93bmV4dHRpY2suaHRtbFxuXG4vLyBTYWZhcmkgNi4wLjUgKGF0IGxlYXN0KSBpbnRlcm1pdHRlbnRseSBmYWlscyB0byBjcmVhdGUgbWVzc2FnZSBwb3J0cyBvbiBhXG4vLyBwYWdlJ3MgZmlyc3QgbG9hZC4gVGhhbmtmdWxseSwgdGhpcyB2ZXJzaW9uIG9mIFNhZmFyaSBzdXBwb3J0c1xuLy8gTXV0YXRpb25PYnNlcnZlcnMsIHNvIHdlIGRvbid0IG5lZWQgdG8gZmFsbCBiYWNrIGluIHRoYXQgY2FzZS5cblxuLy8gZnVuY3Rpb24gbWFrZVJlcXVlc3RDYWxsRnJvbU1lc3NhZ2VDaGFubmVsKGNhbGxiYWNrKSB7XG4vLyAgICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbi8vICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGNhbGxiYWNrO1xuLy8gICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0Q2FsbCgpIHtcbi8vICAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcbi8vICAgICB9O1xuLy8gfVxuXG4vLyBGb3IgcmVhc29ucyBleHBsYWluZWQgYWJvdmUsIHdlIGFyZSBhbHNvIHVuYWJsZSB0byB1c2UgYHNldEltbWVkaWF0ZWBcbi8vIHVuZGVyIGFueSBjaXJjdW1zdGFuY2VzLlxuLy8gRXZlbiBpZiB3ZSB3ZXJlLCB0aGVyZSBpcyBhbm90aGVyIGJ1ZyBpbiBJbnRlcm5ldCBFeHBsb3JlciAxMC5cbi8vIEl0IGlzIG5vdCBzdWZmaWNpZW50IHRvIGFzc2lnbiBgc2V0SW1tZWRpYXRlYCB0byBgcmVxdWVzdEZsdXNoYCBiZWNhdXNlXG4vLyBgc2V0SW1tZWRpYXRlYCBtdXN0IGJlIGNhbGxlZCAqYnkgbmFtZSogYW5kIHRoZXJlZm9yZSBtdXN0IGJlIHdyYXBwZWQgaW4gYVxuLy8gY2xvc3VyZS5cbi8vIE5ldmVyIGZvcmdldC5cblxuLy8gZnVuY3Rpb24gbWFrZVJlcXVlc3RDYWxsRnJvbVNldEltbWVkaWF0ZShjYWxsYmFjaykge1xuLy8gICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0Q2FsbCgpIHtcbi8vICAgICAgICAgc2V0SW1tZWRpYXRlKGNhbGxiYWNrKTtcbi8vICAgICB9O1xuLy8gfVxuXG4vLyBTYWZhcmkgNi4wIGhhcyBhIHByb2JsZW0gd2hlcmUgdGltZXJzIHdpbGwgZ2V0IGxvc3Qgd2hpbGUgdGhlIHVzZXIgaXNcbi8vIHNjcm9sbGluZy4gVGhpcyBwcm9ibGVtIGRvZXMgbm90IGltcGFjdCBBU0FQIGJlY2F1c2UgU2FmYXJpIDYuMCBzdXBwb3J0c1xuLy8gbXV0YXRpb24gb2JzZXJ2ZXJzLCBzbyB0aGF0IGltcGxlbWVudGF0aW9uIGlzIHVzZWQgaW5zdGVhZC5cbi8vIEhvd2V2ZXIsIGlmIHdlIGV2ZXIgZWxlY3QgdG8gdXNlIHRpbWVycyBpbiBTYWZhcmksIHRoZSBwcmV2YWxlbnQgd29yay1hcm91bmRcbi8vIGlzIHRvIGFkZCBhIHNjcm9sbCBldmVudCBsaXN0ZW5lciB0aGF0IGNhbGxzIGZvciBhIGZsdXNoLlxuXG4vLyBgc2V0VGltZW91dGAgZG9lcyBub3QgY2FsbCB0aGUgcGFzc2VkIGNhbGxiYWNrIGlmIHRoZSBkZWxheSBpcyBsZXNzIHRoYW5cbi8vIGFwcHJveGltYXRlbHkgNyBpbiB3ZWIgd29ya2VycyBpbiBGaXJlZm94IDggdGhyb3VnaCAxOCwgYW5kIHNvbWV0aW1lcyBub3Rcbi8vIGV2ZW4gdGhlbi5cblxuZnVuY3Rpb24gbWFrZVJlcXVlc3RDYWxsRnJvbVRpbWVyKGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RDYWxsKCkge1xuICAgICAgICAvLyBXZSBkaXNwYXRjaCBhIHRpbWVvdXQgd2l0aCBhIHNwZWNpZmllZCBkZWxheSBvZiAwIGZvciBlbmdpbmVzIHRoYXRcbiAgICAgICAgLy8gY2FuIHJlbGlhYmx5IGFjY29tbW9kYXRlIHRoYXQgcmVxdWVzdC4gVGhpcyB3aWxsIHVzdWFsbHkgYmUgc25hcHBlZFxuICAgICAgICAvLyB0byBhIDQgbWlsaXNlY29uZCBkZWxheSwgYnV0IG9uY2Ugd2UncmUgZmx1c2hpbmcsIHRoZXJlJ3Mgbm8gZGVsYXlcbiAgICAgICAgLy8gYmV0d2VlbiBldmVudHMuXG4gICAgICAgIHZhciB0aW1lb3V0SGFuZGxlID0gc2V0VGltZW91dChoYW5kbGVUaW1lciwgMCk7XG4gICAgICAgIC8vIEhvd2V2ZXIsIHNpbmNlIHRoaXMgdGltZXIgZ2V0cyBmcmVxdWVudGx5IGRyb3BwZWQgaW4gRmlyZWZveFxuICAgICAgICAvLyB3b3JrZXJzLCB3ZSBlbmxpc3QgYW4gaW50ZXJ2YWwgaGFuZGxlIHRoYXQgd2lsbCB0cnkgdG8gZmlyZVxuICAgICAgICAvLyBhbiBldmVudCAyMCB0aW1lcyBwZXIgc2Vjb25kIHVudGlsIGl0IHN1Y2NlZWRzLlxuICAgICAgICB2YXIgaW50ZXJ2YWxIYW5kbGUgPSBzZXRJbnRlcnZhbChoYW5kbGVUaW1lciwgNTApO1xuXG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZVRpbWVyKCkge1xuICAgICAgICAgICAgLy8gV2hpY2hldmVyIHRpbWVyIHN1Y2NlZWRzIHdpbGwgY2FuY2VsIGJvdGggdGltZXJzIGFuZFxuICAgICAgICAgICAgLy8gZXhlY3V0ZSB0aGUgY2FsbGJhY2suXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEhhbmRsZSk7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsSGFuZGxlKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG4vLyBUaGlzIGlzIGZvciBgYXNhcC5qc2Agb25seS5cbi8vIEl0cyBuYW1lIHdpbGwgYmUgcGVyaW9kaWNhbGx5IHJhbmRvbWl6ZWQgdG8gYnJlYWsgYW55IGNvZGUgdGhhdCBkZXBlbmRzIG9uXG4vLyBpdHMgZXhpc3RlbmNlLlxucmF3QXNhcC5tYWtlUmVxdWVzdENhbGxGcm9tVGltZXIgPSBtYWtlUmVxdWVzdENhbGxGcm9tVGltZXI7XG5cbi8vIEFTQVAgd2FzIG9yaWdpbmFsbHkgYSBuZXh0VGljayBzaGltIGluY2x1ZGVkIGluIFEuIFRoaXMgd2FzIGZhY3RvcmVkIG91dFxuLy8gaW50byB0aGlzIEFTQVAgcGFja2FnZS4gSXQgd2FzIGxhdGVyIGFkYXB0ZWQgdG8gUlNWUCB3aGljaCBtYWRlIGZ1cnRoZXJcbi8vIGFtZW5kbWVudHMuIFRoZXNlIGRlY2lzaW9ucywgcGFydGljdWxhcmx5IHRvIG1hcmdpbmFsaXplIE1lc3NhZ2VDaGFubmVsIGFuZFxuLy8gdG8gY2FwdHVyZSB0aGUgTXV0YXRpb25PYnNlcnZlciBpbXBsZW1lbnRhdGlvbiBpbiBhIGNsb3N1cmUsIHdlcmUgaW50ZWdyYXRlZFxuLy8gYmFjayBpbnRvIEFTQVAgcHJvcGVyLlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3RpbGRlaW8vcnN2cC5qcy9ibG9iL2NkZGY3MjMyNTQ2YTljZjg1ODUyNGI3NWNkZTZmOWVkZjcyNjIwYTcvbGliL3JzdnAvYXNhcC5qc1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliJylcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGFzYXAgPSByZXF1aXJlKCdhc2FwL3JhdycpO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxuLy8gU3RhdGVzOlxuLy9cbi8vIDAgLSBwZW5kaW5nXG4vLyAxIC0gZnVsZmlsbGVkIHdpdGggX3ZhbHVlXG4vLyAyIC0gcmVqZWN0ZWQgd2l0aCBfdmFsdWVcbi8vIDMgLSBhZG9wdGVkIHRoZSBzdGF0ZSBvZiBhbm90aGVyIHByb21pc2UsIF92YWx1ZVxuLy9cbi8vIG9uY2UgdGhlIHN0YXRlIGlzIG5vIGxvbmdlciBwZW5kaW5nICgwKSBpdCBpcyBpbW11dGFibGVcblxuLy8gQWxsIGBfYCBwcmVmaXhlZCBwcm9wZXJ0aWVzIHdpbGwgYmUgcmVkdWNlZCB0byBgX3tyYW5kb20gbnVtYmVyfWBcbi8vIGF0IGJ1aWxkIHRpbWUgdG8gb2JmdXNjYXRlIHRoZW0gYW5kIGRpc2NvdXJhZ2UgdGhlaXIgdXNlLlxuLy8gV2UgZG9uJ3QgdXNlIHN5bWJvbHMgb3IgT2JqZWN0LmRlZmluZVByb3BlcnR5IHRvIGZ1bGx5IGhpZGUgdGhlbVxuLy8gYmVjYXVzZSB0aGUgcGVyZm9ybWFuY2UgaXNuJ3QgZ29vZCBlbm91Z2guXG5cblxuLy8gdG8gYXZvaWQgdXNpbmcgdHJ5L2NhdGNoIGluc2lkZSBjcml0aWNhbCBmdW5jdGlvbnMsIHdlXG4vLyBleHRyYWN0IHRoZW0gdG8gaGVyZS5cbnZhciBMQVNUX0VSUk9SID0gbnVsbDtcbnZhciBJU19FUlJPUiA9IHt9O1xuZnVuY3Rpb24gZ2V0VGhlbihvYmopIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gb2JqLnRoZW47XG4gIH0gY2F0Y2ggKGV4KSB7XG4gICAgTEFTVF9FUlJPUiA9IGV4O1xuICAgIHJldHVybiBJU19FUlJPUjtcbiAgfVxufVxuXG5mdW5jdGlvbiB0cnlDYWxsT25lKGZuLCBhKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGZuKGEpO1xuICB9IGNhdGNoIChleCkge1xuICAgIExBU1RfRVJST1IgPSBleDtcbiAgICByZXR1cm4gSVNfRVJST1I7XG4gIH1cbn1cbmZ1bmN0aW9uIHRyeUNhbGxUd28oZm4sIGEsIGIpIHtcbiAgdHJ5IHtcbiAgICBmbihhLCBiKTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBMQVNUX0VSUk9SID0gZXg7XG4gICAgcmV0dXJuIElTX0VSUk9SO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvbWlzZTtcblxuZnVuY3Rpb24gUHJvbWlzZShmbikge1xuICBpZiAodHlwZW9mIHRoaXMgIT09ICdvYmplY3QnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUHJvbWlzZXMgbXVzdCBiZSBjb25zdHJ1Y3RlZCB2aWEgbmV3Jyk7XG4gIH1cbiAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Byb21pc2UgY29uc3RydWN0b3JcXCdzIGFyZ3VtZW50IGlzIG5vdCBhIGZ1bmN0aW9uJyk7XG4gIH1cbiAgdGhpcy5fVSA9IDA7XG4gIHRoaXMuX1YgPSAwO1xuICB0aGlzLl9XID0gbnVsbDtcbiAgdGhpcy5fWCA9IG51bGw7XG4gIGlmIChmbiA9PT0gbm9vcCkgcmV0dXJuO1xuICBkb1Jlc29sdmUoZm4sIHRoaXMpO1xufVxuUHJvbWlzZS5fWSA9IG51bGw7XG5Qcm9taXNlLl9aID0gbnVsbDtcblByb21pc2UuXzAgPSBub29wO1xuXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuID0gZnVuY3Rpb24ob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcbiAgaWYgKHRoaXMuY29uc3RydWN0b3IgIT09IFByb21pc2UpIHtcbiAgICByZXR1cm4gc2FmZVRoZW4odGhpcywgb25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpO1xuICB9XG4gIHZhciByZXMgPSBuZXcgUHJvbWlzZShub29wKTtcbiAgaGFuZGxlKHRoaXMsIG5ldyBIYW5kbGVyKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkLCByZXMpKTtcbiAgcmV0dXJuIHJlcztcbn07XG5cbmZ1bmN0aW9uIHNhZmVUaGVuKHNlbGYsIG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XG4gIHJldHVybiBuZXcgc2VsZi5jb25zdHJ1Y3RvcihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIHJlcyA9IG5ldyBQcm9taXNlKG5vb3ApO1xuICAgIHJlcy50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgaGFuZGxlKHNlbGYsIG5ldyBIYW5kbGVyKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkLCByZXMpKTtcbiAgfSk7XG59XG5mdW5jdGlvbiBoYW5kbGUoc2VsZiwgZGVmZXJyZWQpIHtcbiAgd2hpbGUgKHNlbGYuX1YgPT09IDMpIHtcbiAgICBzZWxmID0gc2VsZi5fVztcbiAgfVxuICBpZiAoUHJvbWlzZS5fWSkge1xuICAgIFByb21pc2UuX1koc2VsZik7XG4gIH1cbiAgaWYgKHNlbGYuX1YgPT09IDApIHtcbiAgICBpZiAoc2VsZi5fVSA9PT0gMCkge1xuICAgICAgc2VsZi5fVSA9IDE7XG4gICAgICBzZWxmLl9YID0gZGVmZXJyZWQ7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChzZWxmLl9VID09PSAxKSB7XG4gICAgICBzZWxmLl9VID0gMjtcbiAgICAgIHNlbGYuX1ggPSBbc2VsZi5fWCwgZGVmZXJyZWRdO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZWxmLl9YLnB1c2goZGVmZXJyZWQpO1xuICAgIHJldHVybjtcbiAgfVxuICBoYW5kbGVSZXNvbHZlZChzZWxmLCBkZWZlcnJlZCk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVJlc29sdmVkKHNlbGYsIGRlZmVycmVkKSB7XG4gIGFzYXAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNiID0gc2VsZi5fViA9PT0gMSA/IGRlZmVycmVkLm9uRnVsZmlsbGVkIDogZGVmZXJyZWQub25SZWplY3RlZDtcbiAgICBpZiAoY2IgPT09IG51bGwpIHtcbiAgICAgIGlmIChzZWxmLl9WID09PSAxKSB7XG4gICAgICAgIHJlc29sdmUoZGVmZXJyZWQucHJvbWlzZSwgc2VsZi5fVyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWplY3QoZGVmZXJyZWQucHJvbWlzZSwgc2VsZi5fVyk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciByZXQgPSB0cnlDYWxsT25lKGNiLCBzZWxmLl9XKTtcbiAgICBpZiAocmV0ID09PSBJU19FUlJPUikge1xuICAgICAgcmVqZWN0KGRlZmVycmVkLnByb21pc2UsIExBU1RfRVJST1IpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXNvbHZlKGRlZmVycmVkLnByb21pc2UsIHJldCk7XG4gICAgfVxuICB9KTtcbn1cbmZ1bmN0aW9uIHJlc29sdmUoc2VsZiwgbmV3VmFsdWUpIHtcbiAgLy8gUHJvbWlzZSBSZXNvbHV0aW9uIFByb2NlZHVyZTogaHR0cHM6Ly9naXRodWIuY29tL3Byb21pc2VzLWFwbHVzL3Byb21pc2VzLXNwZWMjdGhlLXByb21pc2UtcmVzb2x1dGlvbi1wcm9jZWR1cmVcbiAgaWYgKG5ld1ZhbHVlID09PSBzZWxmKSB7XG4gICAgcmV0dXJuIHJlamVjdChcbiAgICAgIHNlbGYsXG4gICAgICBuZXcgVHlwZUVycm9yKCdBIHByb21pc2UgY2Fubm90IGJlIHJlc29sdmVkIHdpdGggaXRzZWxmLicpXG4gICAgKTtcbiAgfVxuICBpZiAoXG4gICAgbmV3VmFsdWUgJiZcbiAgICAodHlwZW9mIG5ld1ZhbHVlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgbmV3VmFsdWUgPT09ICdmdW5jdGlvbicpXG4gICkge1xuICAgIHZhciB0aGVuID0gZ2V0VGhlbihuZXdWYWx1ZSk7XG4gICAgaWYgKHRoZW4gPT09IElTX0VSUk9SKSB7XG4gICAgICByZXR1cm4gcmVqZWN0KHNlbGYsIExBU1RfRVJST1IpO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICB0aGVuID09PSBzZWxmLnRoZW4gJiZcbiAgICAgIG5ld1ZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZVxuICAgICkge1xuICAgICAgc2VsZi5fViA9IDM7XG4gICAgICBzZWxmLl9XID0gbmV3VmFsdWU7XG4gICAgICBmaW5hbGUoc2VsZik7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZG9SZXNvbHZlKHRoZW4uYmluZChuZXdWYWx1ZSksIHNlbGYpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuICBzZWxmLl9WID0gMTtcbiAgc2VsZi5fVyA9IG5ld1ZhbHVlO1xuICBmaW5hbGUoc2VsZik7XG59XG5cbmZ1bmN0aW9uIHJlamVjdChzZWxmLCBuZXdWYWx1ZSkge1xuICBzZWxmLl9WID0gMjtcbiAgc2VsZi5fVyA9IG5ld1ZhbHVlO1xuICBpZiAoUHJvbWlzZS5fWikge1xuICAgIFByb21pc2UuX1ooc2VsZiwgbmV3VmFsdWUpO1xuICB9XG4gIGZpbmFsZShzZWxmKTtcbn1cbmZ1bmN0aW9uIGZpbmFsZShzZWxmKSB7XG4gIGlmIChzZWxmLl9VID09PSAxKSB7XG4gICAgaGFuZGxlKHNlbGYsIHNlbGYuX1gpO1xuICAgIHNlbGYuX1ggPSBudWxsO1xuICB9XG4gIGlmIChzZWxmLl9VID09PSAyKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLl9YLmxlbmd0aDsgaSsrKSB7XG4gICAgICBoYW5kbGUoc2VsZiwgc2VsZi5fWFtpXSk7XG4gICAgfVxuICAgIHNlbGYuX1ggPSBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIEhhbmRsZXIob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIHByb21pc2Upe1xuICB0aGlzLm9uRnVsZmlsbGVkID0gdHlwZW9mIG9uRnVsZmlsbGVkID09PSAnZnVuY3Rpb24nID8gb25GdWxmaWxsZWQgOiBudWxsO1xuICB0aGlzLm9uUmVqZWN0ZWQgPSB0eXBlb2Ygb25SZWplY3RlZCA9PT0gJ2Z1bmN0aW9uJyA/IG9uUmVqZWN0ZWQgOiBudWxsO1xuICB0aGlzLnByb21pc2UgPSBwcm9taXNlO1xufVxuXG4vKipcbiAqIFRha2UgYSBwb3RlbnRpYWxseSBtaXNiZWhhdmluZyByZXNvbHZlciBmdW5jdGlvbiBhbmQgbWFrZSBzdXJlXG4gKiBvbkZ1bGZpbGxlZCBhbmQgb25SZWplY3RlZCBhcmUgb25seSBjYWxsZWQgb25jZS5cbiAqXG4gKiBNYWtlcyBubyBndWFyYW50ZWVzIGFib3V0IGFzeW5jaHJvbnkuXG4gKi9cbmZ1bmN0aW9uIGRvUmVzb2x2ZShmbiwgcHJvbWlzZSkge1xuICB2YXIgZG9uZSA9IGZhbHNlO1xuICB2YXIgcmVzID0gdHJ5Q2FsbFR3byhmbiwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKGRvbmUpIHJldHVybjtcbiAgICBkb25lID0gdHJ1ZTtcbiAgICByZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIGlmIChkb25lKSByZXR1cm47XG4gICAgZG9uZSA9IHRydWU7XG4gICAgcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gIH0pO1xuICBpZiAoIWRvbmUgJiYgcmVzID09PSBJU19FUlJPUikge1xuICAgIGRvbmUgPSB0cnVlO1xuICAgIHJlamVjdChwcm9taXNlLCBMQVNUX0VSUk9SKTtcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb21pc2U7XG5Qcm9taXNlLnByb3RvdHlwZS5kb25lID0gZnVuY3Rpb24gKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XG4gIHZhciBzZWxmID0gYXJndW1lbnRzLmxlbmd0aCA/IHRoaXMudGhlbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpIDogdGhpcztcbiAgc2VsZi50aGVuKG51bGwsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9LCAwKTtcbiAgfSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vL1RoaXMgZmlsZSBjb250YWlucyB0aGUgRVM2IGV4dGVuc2lvbnMgdG8gdGhlIGNvcmUgUHJvbWlzZXMvQSsgQVBJXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvbWlzZTtcblxuLyogU3RhdGljIEZ1bmN0aW9ucyAqL1xuXG52YXIgVFJVRSA9IHZhbHVlUHJvbWlzZSh0cnVlKTtcbnZhciBGQUxTRSA9IHZhbHVlUHJvbWlzZShmYWxzZSk7XG52YXIgTlVMTCA9IHZhbHVlUHJvbWlzZShudWxsKTtcbnZhciBVTkRFRklORUQgPSB2YWx1ZVByb21pc2UodW5kZWZpbmVkKTtcbnZhciBaRVJPID0gdmFsdWVQcm9taXNlKDApO1xudmFyIEVNUFRZU1RSSU5HID0gdmFsdWVQcm9taXNlKCcnKTtcblxuZnVuY3Rpb24gdmFsdWVQcm9taXNlKHZhbHVlKSB7XG4gIHZhciBwID0gbmV3IFByb21pc2UoUHJvbWlzZS5fMCk7XG4gIHAuX1YgPSAxO1xuICBwLl9XID0gdmFsdWU7XG4gIHJldHVybiBwO1xufVxuUHJvbWlzZS5yZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFByb21pc2UpIHJldHVybiB2YWx1ZTtcblxuICBpZiAodmFsdWUgPT09IG51bGwpIHJldHVybiBOVUxMO1xuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFVOREVGSU5FRDtcbiAgaWYgKHZhbHVlID09PSB0cnVlKSByZXR1cm4gVFJVRTtcbiAgaWYgKHZhbHVlID09PSBmYWxzZSkgcmV0dXJuIEZBTFNFO1xuICBpZiAodmFsdWUgPT09IDApIHJldHVybiBaRVJPO1xuICBpZiAodmFsdWUgPT09ICcnKSByZXR1cm4gRU1QVFlTVFJJTkc7XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciB0aGVuID0gdmFsdWUudGhlbjtcbiAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UodGhlbi5iaW5kKHZhbHVlKSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHJlamVjdChleCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlUHJvbWlzZSh2YWx1ZSk7XG59O1xuXG52YXIgaXRlcmFibGVUb0FycmF5ID0gZnVuY3Rpb24gKGl0ZXJhYmxlKSB7XG4gIGlmICh0eXBlb2YgQXJyYXkuZnJvbSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIEVTMjAxNSssIGl0ZXJhYmxlcyBleGlzdFxuICAgIGl0ZXJhYmxlVG9BcnJheSA9IEFycmF5LmZyb207XG4gICAgcmV0dXJuIEFycmF5LmZyb20oaXRlcmFibGUpO1xuICB9XG5cbiAgLy8gRVM1LCBvbmx5IGFycmF5cyBhbmQgYXJyYXktbGlrZXMgZXhpc3RcbiAgaXRlcmFibGVUb0FycmF5ID0gZnVuY3Rpb24gKHgpIHsgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHgpOyB9O1xuICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoaXRlcmFibGUpO1xufVxuXG5Qcm9taXNlLmFsbCA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgdmFyIGFyZ3MgPSBpdGVyYWJsZVRvQXJyYXkoYXJyKTtcblxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHJlc29sdmUoW10pO1xuICAgIHZhciByZW1haW5pbmcgPSBhcmdzLmxlbmd0aDtcbiAgICBmdW5jdGlvbiByZXMoaSwgdmFsKSB7XG4gICAgICBpZiAodmFsICYmICh0eXBlb2YgdmFsID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdmFsID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgUHJvbWlzZSAmJiB2YWwudGhlbiA9PT0gUHJvbWlzZS5wcm90b3R5cGUudGhlbikge1xuICAgICAgICAgIHdoaWxlICh2YWwuX1YgPT09IDMpIHtcbiAgICAgICAgICAgIHZhbCA9IHZhbC5fVztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHZhbC5fViA9PT0gMSkgcmV0dXJuIHJlcyhpLCB2YWwuX1cpO1xuICAgICAgICAgIGlmICh2YWwuX1YgPT09IDIpIHJlamVjdCh2YWwuX1cpO1xuICAgICAgICAgIHZhbC50aGVuKGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgIHJlcyhpLCB2YWwpO1xuICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciB0aGVuID0gdmFsLnRoZW47XG4gICAgICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB2YXIgcCA9IG5ldyBQcm9taXNlKHRoZW4uYmluZCh2YWwpKTtcbiAgICAgICAgICAgIHAudGhlbihmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgIHJlcyhpLCB2YWwpO1xuICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGFyZ3NbaV0gPSB2YWw7XG4gICAgICBpZiAoLS1yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgcmVzb2x2ZShhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXMoaSwgYXJnc1tpXSk7XG4gICAgfVxuICB9KTtcbn07XG5cblByb21pc2UucmVqZWN0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgcmVqZWN0KHZhbHVlKTtcbiAgfSk7XG59O1xuXG5Qcm9taXNlLnJhY2UgPSBmdW5jdGlvbiAodmFsdWVzKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgaXRlcmFibGVUb0FycmF5KHZhbHVlcykuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSl7XG4gICAgICBQcm9taXNlLnJlc29sdmUodmFsdWUpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9KTtcbiAgfSk7XG59O1xuXG4vKiBQcm90b3R5cGUgTWV0aG9kcyAqL1xuXG5Qcm9taXNlLnByb3RvdHlwZVsnY2F0Y2gnXSA9IGZ1bmN0aW9uIChvblJlamVjdGVkKSB7XG4gIHJldHVybiB0aGlzLnRoZW4obnVsbCwgb25SZWplY3RlZCk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4vY29yZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb21pc2U7XG5Qcm9taXNlLnByb3RvdHlwZS5maW5hbGx5ID0gZnVuY3Rpb24gKGYpIHtcbiAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGYoKSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSk7XG4gIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGYoKSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfSk7XG4gIH0pO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcbnJlcXVpcmUoJy4vZG9uZS5qcycpO1xucmVxdWlyZSgnLi9maW5hbGx5LmpzJyk7XG5yZXF1aXJlKCcuL2VzNi1leHRlbnNpb25zLmpzJyk7XG5yZXF1aXJlKCcuL25vZGUtZXh0ZW5zaW9ucy5qcycpO1xucmVxdWlyZSgnLi9zeW5jaHJvbm91cy5qcycpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBUaGlzIGZpbGUgY29udGFpbnMgdGhlbi9wcm9taXNlIHNwZWNpZmljIGV4dGVuc2lvbnMgdGhhdCBhcmUgb25seSB1c2VmdWxcbi8vIGZvciBub2RlLmpzIGludGVyb3BcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcbnZhciBhc2FwID0gcmVxdWlyZSgnYXNhcCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb21pc2U7XG5cbi8qIFN0YXRpYyBGdW5jdGlvbnMgKi9cblxuUHJvbWlzZS5kZW5vZGVpZnkgPSBmdW5jdGlvbiAoZm4sIGFyZ3VtZW50Q291bnQpIHtcbiAgaWYgKFxuICAgIHR5cGVvZiBhcmd1bWVudENvdW50ID09PSAnbnVtYmVyJyAmJiBhcmd1bWVudENvdW50ICE9PSBJbmZpbml0eVxuICApIHtcbiAgICByZXR1cm4gZGVub2RlaWZ5V2l0aENvdW50KGZuLCBhcmd1bWVudENvdW50KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZGVub2RlaWZ5V2l0aG91dENvdW50KGZuKTtcbiAgfVxufTtcblxudmFyIGNhbGxiYWNrRm4gPSAoXG4gICdmdW5jdGlvbiAoZXJyLCByZXMpIHsnICtcbiAgJ2lmIChlcnIpIHsgcmooZXJyKTsgfSBlbHNlIHsgcnMocmVzKTsgfScgK1xuICAnfSdcbik7XG5mdW5jdGlvbiBkZW5vZGVpZnlXaXRoQ291bnQoZm4sIGFyZ3VtZW50Q291bnQpIHtcbiAgdmFyIGFyZ3MgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudENvdW50OyBpKyspIHtcbiAgICBhcmdzLnB1c2goJ2EnICsgaSk7XG4gIH1cbiAgdmFyIGJvZHkgPSBbXG4gICAgJ3JldHVybiBmdW5jdGlvbiAoJyArIGFyZ3Muam9pbignLCcpICsgJykgeycsXG4gICAgJ3ZhciBzZWxmID0gdGhpczsnLFxuICAgICdyZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJzLCByaikgeycsXG4gICAgJ3ZhciByZXMgPSBmbi5jYWxsKCcsXG4gICAgWydzZWxmJ10uY29uY2F0KGFyZ3MpLmNvbmNhdChbY2FsbGJhY2tGbl0pLmpvaW4oJywnKSxcbiAgICAnKTsnLFxuICAgICdpZiAocmVzICYmJyxcbiAgICAnKHR5cGVvZiByZXMgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIHJlcyA9PT0gXCJmdW5jdGlvblwiKSAmJicsXG4gICAgJ3R5cGVvZiByZXMudGhlbiA9PT0gXCJmdW5jdGlvblwiJyxcbiAgICAnKSB7cnMocmVzKTt9JyxcbiAgICAnfSk7JyxcbiAgICAnfTsnXG4gIF0uam9pbignJyk7XG4gIHJldHVybiBGdW5jdGlvbihbJ1Byb21pc2UnLCAnZm4nXSwgYm9keSkoUHJvbWlzZSwgZm4pO1xufVxuZnVuY3Rpb24gZGVub2RlaWZ5V2l0aG91dENvdW50KGZuKSB7XG4gIHZhciBmbkxlbmd0aCA9IE1hdGgubWF4KGZuLmxlbmd0aCAtIDEsIDMpO1xuICB2YXIgYXJncyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGZuTGVuZ3RoOyBpKyspIHtcbiAgICBhcmdzLnB1c2goJ2EnICsgaSk7XG4gIH1cbiAgdmFyIGJvZHkgPSBbXG4gICAgJ3JldHVybiBmdW5jdGlvbiAoJyArIGFyZ3Muam9pbignLCcpICsgJykgeycsXG4gICAgJ3ZhciBzZWxmID0gdGhpczsnLFxuICAgICd2YXIgYXJnczsnLFxuICAgICd2YXIgYXJnTGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDsnLFxuICAgICdpZiAoYXJndW1lbnRzLmxlbmd0aCA+ICcgKyBmbkxlbmd0aCArICcpIHsnLFxuICAgICdhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggKyAxKTsnLFxuICAgICdmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeycsXG4gICAgJ2FyZ3NbaV0gPSBhcmd1bWVudHNbaV07JyxcbiAgICAnfScsXG4gICAgJ30nLFxuICAgICdyZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJzLCByaikgeycsXG4gICAgJ3ZhciBjYiA9ICcgKyBjYWxsYmFja0ZuICsgJzsnLFxuICAgICd2YXIgcmVzOycsXG4gICAgJ3N3aXRjaCAoYXJnTGVuZ3RoKSB7JyxcbiAgICBhcmdzLmNvbmNhdChbJ2V4dHJhJ10pLm1hcChmdW5jdGlvbiAoXywgaW5kZXgpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgICdjYXNlICcgKyAoaW5kZXgpICsgJzonICtcbiAgICAgICAgJ3JlcyA9IGZuLmNhbGwoJyArIFsnc2VsZiddLmNvbmNhdChhcmdzLnNsaWNlKDAsIGluZGV4KSkuY29uY2F0KCdjYicpLmpvaW4oJywnKSArICcpOycgK1xuICAgICAgICAnYnJlYWs7J1xuICAgICAgKTtcbiAgICB9KS5qb2luKCcnKSxcbiAgICAnZGVmYXVsdDonLFxuICAgICdhcmdzW2FyZ0xlbmd0aF0gPSBjYjsnLFxuICAgICdyZXMgPSBmbi5hcHBseShzZWxmLCBhcmdzKTsnLFxuICAgICd9JyxcbiAgICBcbiAgICAnaWYgKHJlcyAmJicsXG4gICAgJyh0eXBlb2YgcmVzID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiByZXMgPT09IFwiZnVuY3Rpb25cIikgJiYnLFxuICAgICd0eXBlb2YgcmVzLnRoZW4gPT09IFwiZnVuY3Rpb25cIicsXG4gICAgJykge3JzKHJlcyk7fScsXG4gICAgJ30pOycsXG4gICAgJ307J1xuICBdLmpvaW4oJycpO1xuXG4gIHJldHVybiBGdW5jdGlvbihcbiAgICBbJ1Byb21pc2UnLCAnZm4nXSxcbiAgICBib2R5XG4gICkoUHJvbWlzZSwgZm4pO1xufVxuXG5Qcm9taXNlLm5vZGVpZnkgPSBmdW5jdGlvbiAoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgdmFyIGNhbGxiYWNrID1cbiAgICAgIHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT09ICdmdW5jdGlvbicgPyBhcmdzLnBvcCgpIDogbnVsbDtcbiAgICB2YXIgY3R4ID0gdGhpcztcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykubm9kZWlmeShjYWxsYmFjaywgY3R4KTtcbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgaWYgKGNhbGxiYWNrID09PSBudWxsIHx8IHR5cGVvZiBjYWxsYmFjayA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgIHJlamVjdChleCk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXNhcChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY2FsbGJhY2suY2FsbChjdHgsIGV4KTtcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cblByb21pc2UucHJvdG90eXBlLm5vZGVpZnkgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGN0eCkge1xuICBpZiAodHlwZW9mIGNhbGxiYWNrICE9ICdmdW5jdGlvbicpIHJldHVybiB0aGlzO1xuXG4gIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNhbGxiYWNrLmNhbGwoY3R4LCBudWxsLCB2YWx1ZSk7XG4gICAgfSk7XG4gIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBhc2FwKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNhbGxiYWNrLmNhbGwoY3R4LCBlcnIpO1xuICAgIH0pO1xuICB9KTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvbWlzZTtcblByb21pc2UuZW5hYmxlU3luY2hyb25vdXMgPSBmdW5jdGlvbiAoKSB7XG4gIFByb21pc2UucHJvdG90eXBlLmlzUGVuZGluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmdldFN0YXRlKCkgPT0gMDtcbiAgfTtcblxuICBQcm9taXNlLnByb3RvdHlwZS5pc0Z1bGZpbGxlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmdldFN0YXRlKCkgPT0gMTtcbiAgfTtcblxuICBQcm9taXNlLnByb3RvdHlwZS5pc1JlamVjdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0U3RhdGUoKSA9PSAyO1xuICB9O1xuXG4gIFByb21pc2UucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9WID09PSAzKSB7XG4gICAgICByZXR1cm4gdGhpcy5fVy5nZXRWYWx1ZSgpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5pc0Z1bGZpbGxlZCgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBnZXQgYSB2YWx1ZSBvZiBhbiB1bmZ1bGZpbGxlZCBwcm9taXNlLicpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9XO1xuICB9O1xuXG4gIFByb21pc2UucHJvdG90eXBlLmdldFJlYXNvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fViA9PT0gMykge1xuICAgICAgcmV0dXJuIHRoaXMuX1cuZ2V0UmVhc29uKCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmlzUmVqZWN0ZWQoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZ2V0IGEgcmVqZWN0aW9uIHJlYXNvbiBvZiBhIG5vbi1yZWplY3RlZCBwcm9taXNlLicpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9XO1xuICB9O1xuXG4gIFByb21pc2UucHJvdG90eXBlLmdldFN0YXRlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9WID09PSAzKSB7XG4gICAgICByZXR1cm4gdGhpcy5fVy5nZXRTdGF0ZSgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fViA9PT0gLTEgfHwgdGhpcy5fViA9PT0gLTIpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9WO1xuICB9O1xufTtcblxuUHJvbWlzZS5kaXNhYmxlU3luY2hyb25vdXMgPSBmdW5jdGlvbigpIHtcbiAgUHJvbWlzZS5wcm90b3R5cGUuaXNQZW5kaW5nID0gdW5kZWZpbmVkO1xuICBQcm9taXNlLnByb3RvdHlwZS5pc0Z1bGZpbGxlZCA9IHVuZGVmaW5lZDtcbiAgUHJvbWlzZS5wcm90b3R5cGUuaXNSZWplY3RlZCA9IHVuZGVmaW5lZDtcbiAgUHJvbWlzZS5wcm90b3R5cGUuZ2V0VmFsdWUgPSB1bmRlZmluZWQ7XG4gIFByb21pc2UucHJvdG90eXBlLmdldFJlYXNvbiA9IHVuZGVmaW5lZDtcbiAgUHJvbWlzZS5wcm90b3R5cGUuZ2V0U3RhdGUgPSB1bmRlZmluZWQ7XG59O1xuIiwidmFyIGc7XG5cbi8vIFRoaXMgd29ya3MgaW4gbm9uLXN0cmljdCBtb2RlXG5nID0gKGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcztcbn0pKCk7XG5cbnRyeSB7XG5cdC8vIFRoaXMgd29ya3MgaWYgZXZhbCBpcyBhbGxvd2VkIChzZWUgQ1NQKVxuXHRnID0gZyB8fCBuZXcgRnVuY3Rpb24oXCJyZXR1cm4gdGhpc1wiKSgpO1xufSBjYXRjaCAoZSkge1xuXHQvLyBUaGlzIHdvcmtzIGlmIHRoZSB3aW5kb3cgcmVmZXJlbmNlIGlzIGF2YWlsYWJsZVxuXHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gXCJvYmplY3RcIikgZyA9IHdpbmRvdztcbn1cblxuLy8gZyBjYW4gc3RpbGwgYmUgdW5kZWZpbmVkLCBidXQgbm90aGluZyB0byBkbyBhYm91dCBpdC4uLlxuLy8gV2UgcmV0dXJuIHVuZGVmaW5lZCwgaW5zdGVhZCBvZiBub3RoaW5nIGhlcmUsIHNvIGl0J3Ncbi8vIGVhc2llciB0byBoYW5kbGUgdGhpcyBjYXNlLiBpZighZ2xvYmFsKSB7IC4uLn1cblxubW9kdWxlLmV4cG9ydHMgPSBnO1xuIiwidmFyIHN1cHBvcnQgPSB7XG4gIHNlYXJjaFBhcmFtczogJ1VSTFNlYXJjaFBhcmFtcycgaW4gc2VsZixcbiAgaXRlcmFibGU6ICdTeW1ib2wnIGluIHNlbGYgJiYgJ2l0ZXJhdG9yJyBpbiBTeW1ib2wsXG4gIGJsb2I6XG4gICAgJ0ZpbGVSZWFkZXInIGluIHNlbGYgJiZcbiAgICAnQmxvYicgaW4gc2VsZiAmJlxuICAgIChmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIG5ldyBCbG9iKClcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfSkoKSxcbiAgZm9ybURhdGE6ICdGb3JtRGF0YScgaW4gc2VsZixcbiAgYXJyYXlCdWZmZXI6ICdBcnJheUJ1ZmZlcicgaW4gc2VsZlxufVxuXG5mdW5jdGlvbiBpc0RhdGFWaWV3KG9iaikge1xuICByZXR1cm4gb2JqICYmIERhdGFWaWV3LnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKG9iailcbn1cblxuaWYgKHN1cHBvcnQuYXJyYXlCdWZmZXIpIHtcbiAgdmFyIHZpZXdDbGFzc2VzID0gW1xuICAgICdbb2JqZWN0IEludDhBcnJheV0nLFxuICAgICdbb2JqZWN0IFVpbnQ4QXJyYXldJyxcbiAgICAnW29iamVjdCBVaW50OENsYW1wZWRBcnJheV0nLFxuICAgICdbb2JqZWN0IEludDE2QXJyYXldJyxcbiAgICAnW29iamVjdCBVaW50MTZBcnJheV0nLFxuICAgICdbb2JqZWN0IEludDMyQXJyYXldJyxcbiAgICAnW29iamVjdCBVaW50MzJBcnJheV0nLFxuICAgICdbb2JqZWN0IEZsb2F0MzJBcnJheV0nLFxuICAgICdbb2JqZWN0IEZsb2F0NjRBcnJheV0nXG4gIF1cblxuICB2YXIgaXNBcnJheUJ1ZmZlclZpZXcgPVxuICAgIEFycmF5QnVmZmVyLmlzVmlldyB8fFxuICAgIGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiAmJiB2aWV3Q2xhc3Nlcy5pbmRleE9mKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopKSA+IC0xXG4gICAgfVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemVOYW1lKG5hbWUpIHtcbiAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgIG5hbWUgPSBTdHJpbmcobmFtZSlcbiAgfVxuICBpZiAoL1teYS16MC05XFwtIyQlJicqKy5eX2B8fl0vaS50ZXN0KG5hbWUpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBjaGFyYWN0ZXIgaW4gaGVhZGVyIGZpZWxkIG5hbWUnKVxuICB9XG4gIHJldHVybiBuYW1lLnRvTG93ZXJDYXNlKClcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVmFsdWUodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSlcbiAgfVxuICByZXR1cm4gdmFsdWVcbn1cblxuLy8gQnVpbGQgYSBkZXN0cnVjdGl2ZSBpdGVyYXRvciBmb3IgdGhlIHZhbHVlIGxpc3RcbmZ1bmN0aW9uIGl0ZXJhdG9yRm9yKGl0ZW1zKSB7XG4gIHZhciBpdGVyYXRvciA9IHtcbiAgICBuZXh0OiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB2YWx1ZSA9IGl0ZW1zLnNoaWZ0KClcbiAgICAgIHJldHVybiB7ZG9uZTogdmFsdWUgPT09IHVuZGVmaW5lZCwgdmFsdWU6IHZhbHVlfVxuICAgIH1cbiAgfVxuXG4gIGlmIChzdXBwb3J0Lml0ZXJhYmxlKSB7XG4gICAgaXRlcmF0b3JbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGl0ZXJhdG9yXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGl0ZXJhdG9yXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBIZWFkZXJzKGhlYWRlcnMpIHtcbiAgdGhpcy5tYXAgPSB7fVxuXG4gIGlmIChoZWFkZXJzIGluc3RhbmNlb2YgSGVhZGVycykge1xuICAgIGhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgdGhpcy5hcHBlbmQobmFtZSwgdmFsdWUpXG4gICAgfSwgdGhpcylcbiAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGhlYWRlcnMpKSB7XG4gICAgaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKGhlYWRlcikge1xuICAgICAgdGhpcy5hcHBlbmQoaGVhZGVyWzBdLCBoZWFkZXJbMV0pXG4gICAgfSwgdGhpcylcbiAgfSBlbHNlIGlmIChoZWFkZXJzKSB7XG4gICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoaGVhZGVycykuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICB0aGlzLmFwcGVuZChuYW1lLCBoZWFkZXJzW25hbWVdKVxuICAgIH0sIHRoaXMpXG4gIH1cbn1cblxuSGVhZGVycy5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgbmFtZSA9IG5vcm1hbGl6ZU5hbWUobmFtZSlcbiAgdmFsdWUgPSBub3JtYWxpemVWYWx1ZSh2YWx1ZSlcbiAgdmFyIG9sZFZhbHVlID0gdGhpcy5tYXBbbmFtZV1cbiAgdGhpcy5tYXBbbmFtZV0gPSBvbGRWYWx1ZSA/IG9sZFZhbHVlICsgJywgJyArIHZhbHVlIDogdmFsdWVcbn1cblxuSGVhZGVycy5wcm90b3R5cGVbJ2RlbGV0ZSddID0gZnVuY3Rpb24obmFtZSkge1xuICBkZWxldGUgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV1cbn1cblxuSGVhZGVycy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICBuYW1lID0gbm9ybWFsaXplTmFtZShuYW1lKVxuICByZXR1cm4gdGhpcy5oYXMobmFtZSkgPyB0aGlzLm1hcFtuYW1lXSA6IG51bGxcbn1cblxuSGVhZGVycy5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gdGhpcy5tYXAuaGFzT3duUHJvcGVydHkobm9ybWFsaXplTmFtZShuYW1lKSlcbn1cblxuSGVhZGVycy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV0gPSBub3JtYWxpemVWYWx1ZSh2YWx1ZSlcbn1cblxuSGVhZGVycy5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gIGZvciAodmFyIG5hbWUgaW4gdGhpcy5tYXApIHtcbiAgICBpZiAodGhpcy5tYXAuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdGhpcy5tYXBbbmFtZV0sIG5hbWUsIHRoaXMpXG4gICAgfVxuICB9XG59XG5cbkhlYWRlcnMucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGl0ZW1zID0gW11cbiAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgaXRlbXMucHVzaChuYW1lKVxuICB9KVxuICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpXG59XG5cbkhlYWRlcnMucHJvdG90eXBlLnZhbHVlcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaXRlbXMgPSBbXVxuICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUpIHtcbiAgICBpdGVtcy5wdXNoKHZhbHVlKVxuICB9KVxuICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpXG59XG5cbkhlYWRlcnMucHJvdG90eXBlLmVudHJpZXMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGl0ZW1zID0gW11cbiAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgaXRlbXMucHVzaChbbmFtZSwgdmFsdWVdKVxuICB9KVxuICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpXG59XG5cbmlmIChzdXBwb3J0Lml0ZXJhYmxlKSB7XG4gIEhlYWRlcnMucHJvdG90eXBlW1N5bWJvbC5pdGVyYXRvcl0gPSBIZWFkZXJzLnByb3RvdHlwZS5lbnRyaWVzXG59XG5cbmZ1bmN0aW9uIGNvbnN1bWVkKGJvZHkpIHtcbiAgaWYgKGJvZHkuYm9keVVzZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IFR5cGVFcnJvcignQWxyZWFkeSByZWFkJykpXG4gIH1cbiAgYm9keS5ib2R5VXNlZCA9IHRydWVcbn1cblxuZnVuY3Rpb24gZmlsZVJlYWRlclJlYWR5KHJlYWRlcikge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxuICAgIH1cbiAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmVqZWN0KHJlYWRlci5lcnJvcilcbiAgICB9XG4gIH0pXG59XG5cbmZ1bmN0aW9uIHJlYWRCbG9iQXNBcnJheUJ1ZmZlcihibG9iKSB7XG4gIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gIHZhciBwcm9taXNlID0gZmlsZVJlYWRlclJlYWR5KHJlYWRlcilcbiAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGJsb2IpXG4gIHJldHVybiBwcm9taXNlXG59XG5cbmZ1bmN0aW9uIHJlYWRCbG9iQXNUZXh0KGJsb2IpIHtcbiAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcbiAgdmFyIHByb21pc2UgPSBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKVxuICByZWFkZXIucmVhZEFzVGV4dChibG9iKVxuICByZXR1cm4gcHJvbWlzZVxufVxuXG5mdW5jdGlvbiByZWFkQXJyYXlCdWZmZXJBc1RleHQoYnVmKSB7XG4gIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYnVmKVxuICB2YXIgY2hhcnMgPSBuZXcgQXJyYXkodmlldy5sZW5ndGgpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB2aWV3Lmxlbmd0aDsgaSsrKSB7XG4gICAgY2hhcnNbaV0gPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHZpZXdbaV0pXG4gIH1cbiAgcmV0dXJuIGNoYXJzLmpvaW4oJycpXG59XG5cbmZ1bmN0aW9uIGJ1ZmZlckNsb25lKGJ1Zikge1xuICBpZiAoYnVmLnNsaWNlKSB7XG4gICAgcmV0dXJuIGJ1Zi5zbGljZSgwKVxuICB9IGVsc2Uge1xuICAgIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYnVmLmJ5dGVMZW5ndGgpXG4gICAgdmlldy5zZXQobmV3IFVpbnQ4QXJyYXkoYnVmKSlcbiAgICByZXR1cm4gdmlldy5idWZmZXJcbiAgfVxufVxuXG5mdW5jdGlvbiBCb2R5KCkge1xuICB0aGlzLmJvZHlVc2VkID0gZmFsc2VcblxuICB0aGlzLl9pbml0Qm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgICB0aGlzLl9ib2R5SW5pdCA9IGJvZHlcbiAgICBpZiAoIWJvZHkpIHtcbiAgICAgIHRoaXMuX2JvZHlUZXh0ID0gJydcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5fYm9keVRleHQgPSBib2R5XG4gICAgfSBlbHNlIGlmIChzdXBwb3J0LmJsb2IgJiYgQmxvYi5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgdGhpcy5fYm9keUJsb2IgPSBib2R5XG4gICAgfSBlbHNlIGlmIChzdXBwb3J0LmZvcm1EYXRhICYmIEZvcm1EYXRhLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICB0aGlzLl9ib2R5Rm9ybURhdGEgPSBib2R5XG4gICAgfSBlbHNlIGlmIChzdXBwb3J0LnNlYXJjaFBhcmFtcyAmJiBVUkxTZWFyY2hQYXJhbXMucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keS50b1N0cmluZygpXG4gICAgfSBlbHNlIGlmIChzdXBwb3J0LmFycmF5QnVmZmVyICYmIHN1cHBvcnQuYmxvYiAmJiBpc0RhdGFWaWV3KGJvZHkpKSB7XG4gICAgICB0aGlzLl9ib2R5QXJyYXlCdWZmZXIgPSBidWZmZXJDbG9uZShib2R5LmJ1ZmZlcilcbiAgICAgIC8vIElFIDEwLTExIGNhbid0IGhhbmRsZSBhIERhdGFWaWV3IGJvZHkuXG4gICAgICB0aGlzLl9ib2R5SW5pdCA9IG5ldyBCbG9iKFt0aGlzLl9ib2R5QXJyYXlCdWZmZXJdKVxuICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlciAmJiAoQXJyYXlCdWZmZXIucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkgfHwgaXNBcnJheUJ1ZmZlclZpZXcoYm9keSkpKSB7XG4gICAgICB0aGlzLl9ib2R5QXJyYXlCdWZmZXIgPSBidWZmZXJDbG9uZShib2R5KVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHkgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYm9keSlcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuaGVhZGVycy5nZXQoJ2NvbnRlbnQtdHlwZScpKSB7XG4gICAgICBpZiAodHlwZW9mIGJvZHkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRoaXMuaGVhZGVycy5zZXQoJ2NvbnRlbnQtdHlwZScsICd0ZXh0L3BsYWluO2NoYXJzZXQ9VVRGLTgnKVxuICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QmxvYiAmJiB0aGlzLl9ib2R5QmxvYi50eXBlKSB7XG4gICAgICAgIHRoaXMuaGVhZGVycy5zZXQoJ2NvbnRlbnQtdHlwZScsIHRoaXMuX2JvZHlCbG9iLnR5cGUpXG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuc2VhcmNoUGFyYW1zICYmIFVSTFNlYXJjaFBhcmFtcy5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KCdjb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkO2NoYXJzZXQ9VVRGLTgnKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChzdXBwb3J0LmJsb2IpIHtcbiAgICB0aGlzLmJsb2IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpXG4gICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgcmV0dXJuIHJlamVjdGVkXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlCbG9iKVxuICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgQmxvYihbdGhpcy5fYm9keUFycmF5QnVmZmVyXSkpXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlGb3JtRGF0YSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgYmxvYicpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBCbG9iKFt0aGlzLl9ib2R5VGV4dF0pKVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuYXJyYXlCdWZmZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpIHtcbiAgICAgICAgcmV0dXJuIGNvbnN1bWVkKHRoaXMpIHx8IFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5ibG9iKCkudGhlbihyZWFkQmxvYkFzQXJyYXlCdWZmZXIpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdGhpcy50ZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcylcbiAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgIHJldHVybiByZWplY3RlZFxuICAgIH1cblxuICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgcmV0dXJuIHJlYWRCbG9iQXNUZXh0KHRoaXMuX2JvZHlCbG9iKVxuICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlYWRBcnJheUJ1ZmZlckFzVGV4dCh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpKVxuICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgdGV4dCcpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keVRleHQpXG4gICAgfVxuICB9XG5cbiAgaWYgKHN1cHBvcnQuZm9ybURhdGEpIHtcbiAgICB0aGlzLmZvcm1EYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy50ZXh0KCkudGhlbihkZWNvZGUpXG4gICAgfVxuICB9XG5cbiAgdGhpcy5qc29uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oSlNPTi5wYXJzZSlcbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8vIEhUVFAgbWV0aG9kcyB3aG9zZSBjYXBpdGFsaXphdGlvbiBzaG91bGQgYmUgbm9ybWFsaXplZFxudmFyIG1ldGhvZHMgPSBbJ0RFTEVURScsICdHRVQnLCAnSEVBRCcsICdPUFRJT05TJywgJ1BPU1QnLCAnUFVUJ11cblxuZnVuY3Rpb24gbm9ybWFsaXplTWV0aG9kKG1ldGhvZCkge1xuICB2YXIgdXBjYXNlZCA9IG1ldGhvZC50b1VwcGVyQ2FzZSgpXG4gIHJldHVybiBtZXRob2RzLmluZGV4T2YodXBjYXNlZCkgPiAtMSA/IHVwY2FzZWQgOiBtZXRob2Rcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFJlcXVlc3QoaW5wdXQsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgdmFyIGJvZHkgPSBvcHRpb25zLmJvZHlcblxuICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBSZXF1ZXN0KSB7XG4gICAgaWYgKGlucHV0LmJvZHlVc2VkKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBbHJlYWR5IHJlYWQnKVxuICAgIH1cbiAgICB0aGlzLnVybCA9IGlucHV0LnVybFxuICAgIHRoaXMuY3JlZGVudGlhbHMgPSBpbnB1dC5jcmVkZW50aWFsc1xuICAgIGlmICghb3B0aW9ucy5oZWFkZXJzKSB7XG4gICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhpbnB1dC5oZWFkZXJzKVxuICAgIH1cbiAgICB0aGlzLm1ldGhvZCA9IGlucHV0Lm1ldGhvZFxuICAgIHRoaXMubW9kZSA9IGlucHV0Lm1vZGVcbiAgICB0aGlzLnNpZ25hbCA9IGlucHV0LnNpZ25hbFxuICAgIGlmICghYm9keSAmJiBpbnB1dC5fYm9keUluaXQgIT0gbnVsbCkge1xuICAgICAgYm9keSA9IGlucHV0Ll9ib2R5SW5pdFxuICAgICAgaW5wdXQuYm9keVVzZWQgPSB0cnVlXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRoaXMudXJsID0gU3RyaW5nKGlucHV0KVxuICB9XG5cbiAgdGhpcy5jcmVkZW50aWFscyA9IG9wdGlvbnMuY3JlZGVudGlhbHMgfHwgdGhpcy5jcmVkZW50aWFscyB8fCAnc2FtZS1vcmlnaW4nXG4gIGlmIChvcHRpb25zLmhlYWRlcnMgfHwgIXRoaXMuaGVhZGVycykge1xuICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKG9wdGlvbnMuaGVhZGVycylcbiAgfVxuICB0aGlzLm1ldGhvZCA9IG5vcm1hbGl6ZU1ldGhvZChvcHRpb25zLm1ldGhvZCB8fCB0aGlzLm1ldGhvZCB8fCAnR0VUJylcbiAgdGhpcy5tb2RlID0gb3B0aW9ucy5tb2RlIHx8IHRoaXMubW9kZSB8fCBudWxsXG4gIHRoaXMuc2lnbmFsID0gb3B0aW9ucy5zaWduYWwgfHwgdGhpcy5zaWduYWxcbiAgdGhpcy5yZWZlcnJlciA9IG51bGxcblxuICBpZiAoKHRoaXMubWV0aG9kID09PSAnR0VUJyB8fCB0aGlzLm1ldGhvZCA9PT0gJ0hFQUQnKSAmJiBib2R5KSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQm9keSBub3QgYWxsb3dlZCBmb3IgR0VUIG9yIEhFQUQgcmVxdWVzdHMnKVxuICB9XG4gIHRoaXMuX2luaXRCb2R5KGJvZHkpXG59XG5cblJlcXVlc3QucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgUmVxdWVzdCh0aGlzLCB7Ym9keTogdGhpcy5fYm9keUluaXR9KVxufVxuXG5mdW5jdGlvbiBkZWNvZGUoYm9keSkge1xuICB2YXIgZm9ybSA9IG5ldyBGb3JtRGF0YSgpXG4gIGJvZHlcbiAgICAudHJpbSgpXG4gICAgLnNwbGl0KCcmJylcbiAgICAuZm9yRWFjaChmdW5jdGlvbihieXRlcykge1xuICAgICAgaWYgKGJ5dGVzKSB7XG4gICAgICAgIHZhciBzcGxpdCA9IGJ5dGVzLnNwbGl0KCc9JylcbiAgICAgICAgdmFyIG5hbWUgPSBzcGxpdC5zaGlmdCgpLnJlcGxhY2UoL1xcKy9nLCAnICcpXG4gICAgICAgIHZhciB2YWx1ZSA9IHNwbGl0LmpvaW4oJz0nKS5yZXBsYWNlKC9cXCsvZywgJyAnKVxuICAgICAgICBmb3JtLmFwcGVuZChkZWNvZGVVUklDb21wb25lbnQobmFtZSksIGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkpXG4gICAgICB9XG4gICAgfSlcbiAgcmV0dXJuIGZvcm1cbn1cblxuZnVuY3Rpb24gcGFyc2VIZWFkZXJzKHJhd0hlYWRlcnMpIHtcbiAgdmFyIGhlYWRlcnMgPSBuZXcgSGVhZGVycygpXG4gIC8vIFJlcGxhY2UgaW5zdGFuY2VzIG9mIFxcclxcbiBhbmQgXFxuIGZvbGxvd2VkIGJ5IGF0IGxlYXN0IG9uZSBzcGFjZSBvciBob3Jpem9udGFsIHRhYiB3aXRoIGEgc3BhY2VcbiAgLy8gaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzcyMzAjc2VjdGlvbi0zLjJcbiAgdmFyIHByZVByb2Nlc3NlZEhlYWRlcnMgPSByYXdIZWFkZXJzLnJlcGxhY2UoL1xccj9cXG5bXFx0IF0rL2csICcgJylcbiAgcHJlUHJvY2Vzc2VkSGVhZGVycy5zcGxpdCgvXFxyP1xcbi8pLmZvckVhY2goZnVuY3Rpb24obGluZSkge1xuICAgIHZhciBwYXJ0cyA9IGxpbmUuc3BsaXQoJzonKVxuICAgIHZhciBrZXkgPSBwYXJ0cy5zaGlmdCgpLnRyaW0oKVxuICAgIGlmIChrZXkpIHtcbiAgICAgIHZhciB2YWx1ZSA9IHBhcnRzLmpvaW4oJzonKS50cmltKClcbiAgICAgIGhlYWRlcnMuYXBwZW5kKGtleSwgdmFsdWUpXG4gICAgfVxuICB9KVxuICByZXR1cm4gaGVhZGVyc1xufVxuXG5Cb2R5LmNhbGwoUmVxdWVzdC5wcm90b3R5cGUpXG5cbmV4cG9ydCBmdW5jdGlvbiBSZXNwb25zZShib2R5SW5pdCwgb3B0aW9ucykge1xuICBpZiAoIW9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0ge31cbiAgfVxuXG4gIHRoaXMudHlwZSA9ICdkZWZhdWx0J1xuICB0aGlzLnN0YXR1cyA9IG9wdGlvbnMuc3RhdHVzID09PSB1bmRlZmluZWQgPyAyMDAgOiBvcHRpb25zLnN0YXR1c1xuICB0aGlzLm9rID0gdGhpcy5zdGF0dXMgPj0gMjAwICYmIHRoaXMuc3RhdHVzIDwgMzAwXG4gIHRoaXMuc3RhdHVzVGV4dCA9ICdzdGF0dXNUZXh0JyBpbiBvcHRpb25zID8gb3B0aW9ucy5zdGF0dXNUZXh0IDogJ09LJ1xuICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhvcHRpb25zLmhlYWRlcnMpXG4gIHRoaXMudXJsID0gb3B0aW9ucy51cmwgfHwgJydcbiAgdGhpcy5faW5pdEJvZHkoYm9keUluaXQpXG59XG5cbkJvZHkuY2FsbChSZXNwb25zZS5wcm90b3R5cGUpXG5cblJlc3BvbnNlLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFJlc3BvbnNlKHRoaXMuX2JvZHlJbml0LCB7XG4gICAgc3RhdHVzOiB0aGlzLnN0YXR1cyxcbiAgICBzdGF0dXNUZXh0OiB0aGlzLnN0YXR1c1RleHQsXG4gICAgaGVhZGVyczogbmV3IEhlYWRlcnModGhpcy5oZWFkZXJzKSxcbiAgICB1cmw6IHRoaXMudXJsXG4gIH0pXG59XG5cblJlc3BvbnNlLmVycm9yID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXNwb25zZSA9IG5ldyBSZXNwb25zZShudWxsLCB7c3RhdHVzOiAwLCBzdGF0dXNUZXh0OiAnJ30pXG4gIHJlc3BvbnNlLnR5cGUgPSAnZXJyb3InXG4gIHJldHVybiByZXNwb25zZVxufVxuXG52YXIgcmVkaXJlY3RTdGF0dXNlcyA9IFszMDEsIDMwMiwgMzAzLCAzMDcsIDMwOF1cblxuUmVzcG9uc2UucmVkaXJlY3QgPSBmdW5jdGlvbih1cmwsIHN0YXR1cykge1xuICBpZiAocmVkaXJlY3RTdGF0dXNlcy5pbmRleE9mKHN0YXR1cykgPT09IC0xKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0ludmFsaWQgc3RhdHVzIGNvZGUnKVxuICB9XG5cbiAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7c3RhdHVzOiBzdGF0dXMsIGhlYWRlcnM6IHtsb2NhdGlvbjogdXJsfX0pXG59XG5cbmV4cG9ydCB2YXIgRE9NRXhjZXB0aW9uID0gc2VsZi5ET01FeGNlcHRpb25cbnRyeSB7XG4gIG5ldyBET01FeGNlcHRpb24oKVxufSBjYXRjaCAoZXJyKSB7XG4gIERPTUV4Y2VwdGlvbiA9IGZ1bmN0aW9uKG1lc3NhZ2UsIG5hbWUpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlXG4gICAgdGhpcy5uYW1lID0gbmFtZVxuICAgIHZhciBlcnJvciA9IEVycm9yKG1lc3NhZ2UpXG4gICAgdGhpcy5zdGFjayA9IGVycm9yLnN0YWNrXG4gIH1cbiAgRE9NRXhjZXB0aW9uLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKVxuICBET01FeGNlcHRpb24ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRE9NRXhjZXB0aW9uXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmZXRjaChpbnB1dCwgaW5pdCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIHJlcXVlc3QgPSBuZXcgUmVxdWVzdChpbnB1dCwgaW5pdClcblxuICAgIGlmIChyZXF1ZXN0LnNpZ25hbCAmJiByZXF1ZXN0LnNpZ25hbC5hYm9ydGVkKSB7XG4gICAgICByZXR1cm4gcmVqZWN0KG5ldyBET01FeGNlcHRpb24oJ0Fib3J0ZWQnLCAnQWJvcnRFcnJvcicpKVxuICAgIH1cblxuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKVxuXG4gICAgZnVuY3Rpb24gYWJvcnRYaHIoKSB7XG4gICAgICB4aHIuYWJvcnQoKVxuICAgIH1cblxuICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICBzdGF0dXM6IHhoci5zdGF0dXMsXG4gICAgICAgIHN0YXR1c1RleHQ6IHhoci5zdGF0dXNUZXh0LFxuICAgICAgICBoZWFkZXJzOiBwYXJzZUhlYWRlcnMoeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpIHx8ICcnKVxuICAgICAgfVxuICAgICAgb3B0aW9ucy51cmwgPSAncmVzcG9uc2VVUkwnIGluIHhociA/IHhoci5yZXNwb25zZVVSTCA6IG9wdGlvbnMuaGVhZGVycy5nZXQoJ1gtUmVxdWVzdC1VUkwnKVxuICAgICAgdmFyIGJvZHkgPSAncmVzcG9uc2UnIGluIHhociA/IHhoci5yZXNwb25zZSA6IHhoci5yZXNwb25zZVRleHRcbiAgICAgIHJlc29sdmUobmV3IFJlc3BvbnNlKGJvZHksIG9wdGlvbnMpKVxuICAgIH1cblxuICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICByZWplY3QobmV3IFR5cGVFcnJvcignTmV0d29yayByZXF1ZXN0IGZhaWxlZCcpKVxuICAgIH1cblxuICAgIHhoci5vbnRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJlamVjdChuZXcgVHlwZUVycm9yKCdOZXR3b3JrIHJlcXVlc3QgZmFpbGVkJykpXG4gICAgfVxuXG4gICAgeGhyLm9uYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJlamVjdChuZXcgRE9NRXhjZXB0aW9uKCdBYm9ydGVkJywgJ0Fib3J0RXJyb3InKSlcbiAgICB9XG5cbiAgICB4aHIub3BlbihyZXF1ZXN0Lm1ldGhvZCwgcmVxdWVzdC51cmwsIHRydWUpXG5cbiAgICBpZiAocmVxdWVzdC5jcmVkZW50aWFscyA9PT0gJ2luY2x1ZGUnKSB7XG4gICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZVxuICAgIH0gZWxzZSBpZiAocmVxdWVzdC5jcmVkZW50aWFscyA9PT0gJ29taXQnKSB7XG4gICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gZmFsc2VcbiAgICB9XG5cbiAgICBpZiAoJ3Jlc3BvbnNlVHlwZScgaW4geGhyICYmIHN1cHBvcnQuYmxvYikge1xuICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdibG9iJ1xuICAgIH1cblxuICAgIHJlcXVlc3QuaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihuYW1lLCB2YWx1ZSlcbiAgICB9KVxuXG4gICAgaWYgKHJlcXVlc3Quc2lnbmFsKSB7XG4gICAgICByZXF1ZXN0LnNpZ25hbC5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsIGFib3J0WGhyKVxuXG4gICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIERPTkUgKHN1Y2Nlc3Mgb3IgZmFpbHVyZSlcbiAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgcmVxdWVzdC5zaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBhYm9ydFhocilcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHhoci5zZW5kKHR5cGVvZiByZXF1ZXN0Ll9ib2R5SW5pdCA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogcmVxdWVzdC5fYm9keUluaXQpXG4gIH0pXG59XG5cbmZldGNoLnBvbHlmaWxsID0gdHJ1ZVxuXG5pZiAoIXNlbGYuZmV0Y2gpIHtcbiAgc2VsZi5mZXRjaCA9IGZldGNoXG4gIHNlbGYuSGVhZGVycyA9IEhlYWRlcnNcbiAgc2VsZi5SZXF1ZXN0ID0gUmVxdWVzdFxuICBzZWxmLlJlc3BvbnNlID0gUmVzcG9uc2Vcbn1cbiIsImltcG9ydCAnd2hhdHdnLWZldGNoJztcbmltcG9ydCBSU0FLZXkgZnJvbSAnLi9yc2EuanMnO1xuaW1wb3J0IFByb21pc2UgZnJvbSAncHJvbWlzZSc7XG5pbXBvcnQgQWVzanMgZnJvbSAnYWVzLWpzJztcbmltcG9ydCBwcml2YXRlTnVtYmVycyBmcm9tICcuL2tleU51bWJlcnMuanMnO1xuXG5cbihmdW5jdGlvbigpe1xuICAgIGNvbnN0IGdldFBhcmFtID0gKHVybCxrZXksb3B0X2RlZmF1bHQpID0+IHtcbiAgICAgICAgaWYgKG9wdF9kZWZhdWx0ID09PSB1bmRlZmluZWQpIG9wdF9kZWZhdWx0PVwiXCI7XG4gICAgICAgIGxldCBwYXJ0cz11cmwuc3BsaXQoXCI/XCIpO1xuICAgICAgICBpZiAocGFydHMubGVuZ3RoIDwgMikgcmV0dXJuIG9wdF9kZWZhdWx0O1xuICAgICAgICBsZXQgdmFsdWUgPSBSZWdFeHAoXCJcIiArIGtleSArIFwiW14mXStcIikuZXhlYyhwYXJ0c1sxXSk7XG4gICAgICAgIC8vIFJldHVybiB0aGUgdW5lc2NhcGVkIHZhbHVlIG1pbnVzIGV2ZXJ5dGhpbmcgc3RhcnRpbmcgZnJvbSB0aGUgZXF1YWxzIHNpZ24gb3IgYW4gZW1wdHkgc3RyaW5nXG4gICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoISF2YWx1ZSA/IHZhbHVlLnRvU3RyaW5nKCkucmVwbGFjZSgvXltePV0rLi8sIFwiXCIpIDogb3B0X2RlZmF1bHQpO1xuICAgIH07XG4gICAgbGV0IHN0b3JhZ2VLZXk9XCJhdm5hdi5vY2hhcnRQcm92aWRlci5zZXNzaW9uSWRcIjtcbiAgICBsZXQgc2NyaXB0S2V5PVwib2NoYXJ0c1Byb3ZpZGVyXCI7XG4gICAgbGV0IGN1cnJlbnRLZXk9dW5kZWZpbmVkO1xuICAgIGxldCBjdXJyZW50RW50cnlwdGVkS2V5PXVuZGVmaW5lZDtcbiAgICBsZXQgY3VycmVudENvdW50ZXI9dW5kZWZpbmVkO1xuICAgIGxldCBjdXJyZW50U2VxdWVuY2U9dW5kZWZpbmVkO1xuICAgIGxldCBiYXNlVXJsPXVuZGVmaW5lZDtcbiAgICBpZiAoISB3aW5kb3cuYXZuYXYpIHdpbmRvdy5hdm5hdj17fTtcbiAgICBsZXQgc2NyaXB0PWRvY3VtZW50LmN1cnJlbnRTY3JpcHQ7XG4gICAgaWYgKHNjcmlwdCl7XG4gICAgICAgIGxldCB1cmw9c2NyaXB0LmdldEF0dHJpYnV0ZSgnc3JjJyk7XG4gICAgICAgIGlmICh1cmwpe1xuICAgICAgICAgICAgYmFzZVVybD11cmwucmVwbGFjZSgvXFw/LiovLCcnKTtcbiAgICAgICAgICAgIGxldCBzaz1nZXRQYXJhbSh1cmwsXCJzY3JpcHRLZXlcIik7XG4gICAgICAgICAgICBpZiAoc2spIHtcbiAgICAgICAgICAgICAgICBzY3JpcHRLZXkgPSBzaztcbiAgICAgICAgICAgICAgICBzdG9yYWdlS2V5PVwiYXZuYXYub2NoYXJ0UHJvdmlkZXIuc2Vzc2lvbklkLlwiK3NrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGxldCBjdXJyZW50U2Vzc2lvbklkPWxvY2FsU3RvcmFnZS5nZXRJdGVtKHN0b3JhZ2VLZXkpO1xuICAgIC8qKlxuICAgICBkZWNyeXB0IFJTQVxuICAgICAqL1xuICAgIGxldCBkZWNyeXB0ID0gKHZhbHVlKT0+IHtcbiAgICAgICAgbGV0IGtleSA9IG5ldyBSU0FLZXkoKTtcbiAgICAgICAga2V5LnNldFByaXZhdGVFeChcbiAgICAgICAgICAgIHByaXZhdGVOdW1iZXJzLk4sXG4gICAgICAgICAgICBwcml2YXRlTnVtYmVycy5FLFxuICAgICAgICAgICAgcHJpdmF0ZU51bWJlcnMuRCxcbiAgICAgICAgICAgIHByaXZhdGVOdW1iZXJzLlAsXG4gICAgICAgICAgICBwcml2YXRlTnVtYmVycy5RLFxuICAgICAgICAgICAgcHJpdmF0ZU51bWJlcnMuRFAsXG4gICAgICAgICAgICBwcml2YXRlTnVtYmVycy5EUSxcbiAgICAgICAgICAgIHByaXZhdGVOdW1iZXJzLkNcbiAgICAgICAgKTtcbiAgICAgICAgbGV0IHJ0ID0ga2V5LmRlY3J5cHRCdWZmZXIodmFsdWUucmVwbGFjZSgvOi9nLCBcIlwiKSk7XG4gICAgICAgIHJldHVybiBydDtcblxuICAgIH07XG4gICAgLyoqXG4gICAgICogZW5jcnlwdCBBRVNcbiAgICAgKi9cbiAgICBsZXQgZW5jcnlwdD0odmFsdWUpPT57XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRLZXkpIHJldHVybiBcIm5va2V5XCI7XG4gICAgICAgICAgICBsZXQgYWVzQ3RyID0gbmV3IEFlc2pzLk1vZGVPZk9wZXJhdGlvbi5jdHIoY3VycmVudEtleSxjdXJyZW50Q291bnRlcik7XG4gICAgICAgICAgICBsZXQgZW5jcnlwdGVkQnl0ZXMgPSBhZXNDdHIuZW5jcnlwdChBZXNqcy51dGlscy51dGY4LnRvQnl0ZXModmFsdWUpKTtcbiAgICAgICAgICAgIHJldHVybiBBZXNqcy51dGlscy5oZXguZnJvbUJ5dGVzKGVuY3J5cHRlZEJ5dGVzKTtcbiAgICAgICAgfWNhdGNoIChlKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZW5jcnlwdCBlcnJvclwiKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgbGV0IGdldEJhc2VVcmw9KCk9PntcbiAgICAgICAgaWYgKGJhc2VVcmwpIHJldHVybiBiYXNlVXJsO1xuICAgICAgICBsZXQgZWw9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoc2NyaXB0S2V5KTtcbiAgICAgICAgaWYgKGVsKXtcbiAgICAgICAgICAgIGxldCB1cmw9ZWwuZ2V0QXR0cmlidXRlKCdzcmMnKTtcbiAgICAgICAgICAgIGlmICh1cmwpe1xuICAgICAgICAgICAgICAgIGJhc2VVcmw9dXJsLnJlcGxhY2UoL1xcPy4qLywnJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhc2VVcmw7XG4gICAgfTtcbiAgICBsZXQgZmV0Y2hLZXk9KCk9PntcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCk9PntcbiAgICAgICAgICAgIGxldCB1cmw9Z2V0QmFzZVVybCgpO1xuICAgICAgICAgICAgaWYgKHVybCA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoXCJubyB1cmxcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdXJsPXVybCtcIj9yZXF1ZXN0PWtleVwiO1xuICAgICAgICAgICAgY3VycmVudFNlc3Npb25JZD1sb2NhbFN0b3JhZ2UuZ2V0SXRlbShzdG9yYWdlS2V5KTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50U2Vzc2lvbklkICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgICAgIHVybCs9XCImc2Vzc2lvbklkPVwiK2VuY29kZVVSSUNvbXBvbmVudChjdXJyZW50U2Vzc2lvbklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBvcHRpb25zPXt9O1xuICAgICAgICAgICAgbGV0IGhlYWRlcnM9e307XG4gICAgICAgICAgICBoZWFkZXJzWydwcmFnbWEnXT0nbm8tY2FjaGUnO1xuICAgICAgICAgICAgaGVhZGVyc1snY2FjaGUtY29udHJvbCddPSduby1jYWNoZSc7XG4gICAgICAgICAgICBvcHRpb25zLmhlYWRlcnMgPSBoZWFkZXJzO1xuICAgICAgICAgICAgZmV0Y2godXJsLCBvcHRpb25zKVxuICAgICAgICAgICAgICAgIC50aGVuKChyZXNwb25zZSk9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPCAyMDAgfHwgcmVzcG9uc2Uuc3RhdHVzID49IDMwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlLnN0YXR1c1RleHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZS5zdGF0dXNUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oKGpzb24pPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWpzb24uc3RhdHVzIHx8IGpzb24uc3RhdHVzICE9ICdPSycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChqc29uLnN0YXR1c3x8XCJubyBzdGF0dXNcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShqc29uLmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yKT0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgd2luZG93LmF2bmF2W3NjcmlwdEtleV09e1xuICAgICAgICBoZWFydEJlYXQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUscmVqZWN0KT0+IHtcbiAgICAgICAgICAgICAgICBmZXRjaEtleSgpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKChqc29uRGF0YSk9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoanNvbkRhdGEuc2VxdWVuY2UgIT0gY3VycmVudFNlcXVlbmNlIHx8IGpzb25EYXRhLmtleSAhPSBjdXJyZW50RW50cnlwdGVkS2V5IHx8IGN1cnJlbnRTZXNzaW9uSWQgIT0ganNvbkRhdGEuc2Vzc2lvbklkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50S2V5PWRlY3J5cHQoanNvbkRhdGEua2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudEtleSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRLZXk9dW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoXCJ1bmFibGUgdG8gZGVjcnlwdCBrZXlcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRLZXkubGVuZ3RoICE9IDE2KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudEtleT11bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChcImludmFsaWQga2V5IGxlbmd0aCByZWNlaXZlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50U2Vzc2lvbklkPWpzb25EYXRhLnNlc3Npb25JZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oc3RvcmFnZUtleSkgIT0gY3VycmVudFNlc3Npb25JZCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHN0b3JhZ2VLZXksY3VycmVudFNlc3Npb25JZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRTZXF1ZW5jZT1qc29uRGF0YS5zZXF1ZW5jZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50RW50cnlwdGVkS2V5PWpzb25EYXRhLmtleTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q291bnRlcj1uZXcgQWVzanMuQ291bnRlcigobmV3IERhdGUoKSkuZ2V0VGltZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoMCk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyb3IpPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZW5jcnlwdFVybDogZnVuY3Rpb24odXJsUGFydCl7XG4gICAgICAgICAgICBpZiAoISBjdXJyZW50S2V5KSByZXR1cm47XG4gICAgICAgICAgICByZXR1cm4gXCJlbmNyeXB0ZWQvXCIrY3VycmVudFNlc3Npb25JZCtcIi9cIitjdXJyZW50U2VxdWVuY2UrXCIvXCIrQWVzanMudXRpbHMuaGV4LmZyb21CeXRlcyhjdXJyZW50Q291bnRlci5fY291bnRlcikrXCIvXCIrZW5jcnlwdCh1cmxQYXJ0KTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pKCk7XG5cbiIsInZhciBrZXk9e1xuICAgIE46XCJmM2UzYjIxOWFmNGQ5OTkyODA0M2ZhNjA4N2NmMjMwNmJmMjRlMWQ3N2IyMjhlN2Q0ZDM5ZDg1MmQ0NDhkNjNhMzMyZDU1NzI4NzQ5YWM2ZDE3ZjdjOWNmMGNlMDc5N2EyMWU0ZjUxNmRkNThmMTQwNzhhM2NjOTVkMTA0ZGZiMTcxYTU2OTMwNTMzMzcwMDQyNzc3YzcyN2UxN2NmOWIzNzkzMTVkMTNkMThlYzI4Mzc3ODZjYjc0ZGNlZjU1MTU1NjI0MTZkOTkyZjIyOGFlZDJmMzc0OGY2YjRlNzNmMDZmYzFkMGM3ZjMwZTg5OTAzNDk2NzVhZmU0NGE2NDBmOTA1OWNlNjU5MTIyMTkxNGRlMDkwZmNiY2IyOTVhODUyYWVlOTdmNzBhYWFiMWY0ODliNmQ4MDNmZGYxYmVjMjc2NTYzZmRjNTMzMDQ5NzI3YmNiMzIyMTYzMmUzNjZhMDc5MTQ1ZDc4ZjhlNzkzMTk1YjAyODhmYTYxMjA3MWEzZmEyMzdjMjIxZGVmMjU5MzBjYTIzOWYxOWY0YTRkNzg5ZmE2YjU1Mzk1MGZhMTFmOGNlY2QzZjQ4ZmU0MDIxNGI4YTM3Yjk1ODQyZThlZmRmZmQxZTNlYTYwNTYxYTdkYjVmYmEyNDU4ZWI1MjM4MmU5ZmQ4YTE5OTBiNjk5ZlwiLFxuICAgIEU6XCIxMDAwMVwiLFxuICAgIEQ6XCI2ZjBmYmQ0NmRkMDFhNTcxODU1ZjZmNjEwZGY3NTFhN2ZjZGIzYWNjZjk5MWRlZjk0ODc1OTMwMTA1MTJiNjFiODJiYTllMzJhZDUwZWI2ODMyODVmMDJjOGQ1YzliNzRmNjgyNjBlOWFjOWE5ODIyMTdjZGRmOTg0OWJhYzI3MmY3YTFhZmE5MDVmYTYyODQ0MWM0ZDViODVmODI5ZGUzMTBjOTVkZWQ2YzdjNmEyZjliZmE5MjI0MDE4ODJiNjJhZmZiNzczYzU1MjI1OTRjNjM1YmUyMzQ3ZDU1MTg4ZWUxMTU4ZDkxYzAyOTVhOTM4NDlmMGZiMGFkNzEwMmU2ZmZlZGZlOWMxNDAzMTEwMTNiYmVlZGQxMmJiMjc1YzQzZWU2NzE5ZTAzMGUwMzQyYTJkZDc4ZjVkNTUwZGEwNGQxMjViMDJlMDVkMjZjZWRiMDM0NTc1Y2FiZjRmNTNlMDkyMzlkYjI1MDdiNDdjNzJjNDE3OTdlOWNkM2UzZjk0MjMxMDMxYWQzZGNmNjIyOTkzZjA4NWZhNjdjZTRiZGUyMzJhYTA5Y2JmOWFlYjBkNDE1OWEyZmZiYzUzOTNiM2E2MThiMzc2MDcyOTgwNmIyMTY0YTRjMGE1MWY1Y2MzMzNiNjJiNTkzODVjNzRkMmJmOGM0ODc0MzAxN2JjMVwiLFxuICAgIFA6XCJmYTRiMmZmZGRjYmI1ZGRjZjEyNzkxYzM2NGFjZjZiYTBjNmNkYzYxYzhmOTE3NmQ2NDBmZmRmNzM0YzRjYzZkYTQxZTBkNTc3NjNhNDEzOGIyMmIxODQ1Y2E3YThmYzZhYTI5ODk5NmRlYTk2YzA2MDAxYTUxMWVhYTQ3MDQ2NmMzYWZlNDU3M2VjNzc4Y2U1OWM1MDI5NzIyNzM2ZWNjZmFhZWIxNjBlZDZiODM2NTYyYzliOTlhNDllZDAxMWIyNWIzNmI0OTk3MzI3YmQwYjU0YmU0OGViOTAxZTNkODFjMzg5MDNmNGJhNWFkZGNmNjY3YTUyMjQxN2Q3N2U3XCIsXG4gICAgUTpcImY5NzMyMTYzYmM4MTk2YjU0YjQ1NjUwZDkxODQxOGVmYjA5NTQ5MzdkMWU3ZTYzNmNlMTY1NTA3N2I3ODgxYmQ3YWFiMzJlZWU3NTFjMjE3NmU4YjZhMmM0NGVlY2I0YWFlZDAxNjVmODRjMTkyMjQzZGM2YTZmNTQ1MGZiYWU5M2I2YmM3NDE2MGYyZjMyZTY4Y2JmM2E1ZTExODMwN2U0NGEwZjQ2YWU1MWE1MGFiNjU0NmJhZGRjY2MxODgwOTFhMTkwYTc2ZGMwY2Y0ZWFhNmQyZTFjMmIwNjZlNDNmNzRmOTdhNjFjMTg0Njg4NjhmYzQzOTFmZDI3M2U5ODlcIixcbiAgICBEUDpcIjE2NjE0YWI1NDQ1YjZjOTUyOGViMDRkOTk3ZDJlZjZjY2I1N2EwOGQwZGNmNTgwY2ViZjk5MjE3ZGM5YzBjM2I3MTg1NGU2NDE3YWEzNWQyYmZmYmEyN2JmYjEyZTI3MDNkMWVlMWIyOWZjZTNlNWU3YWZiZGY2ZDAyODRiZjFjMDEzYjY1MGI3ODBkOTVmYmJkODMyNDJjMjc2NDcyZWZkOTJhNmRhOWUxMTBjZmZhZWNjZTY0Y2UyYWY2MGEzNzQ3MzNiN2QwMjhiOGQ2ZTE1ZTk0OWVhNzM0NWJiYWU3YzNmZTNhYzdhZTE3ZWU2N2U3OTA3NGVmOGYzMzhjZDlcIixcbiAgICBEUTpcImQwMzk2YzliYzY5NTFkZWE4M2M0OGY4ZmZkZjIxOGE2YWJlZTUxY2EwOGFiZGQxZGNlNzYxMWQwNDcxZWQ2OWUwNjMxYjYzODdhNWI2MmZiMTA0OWNiZmNkYzI1YzEwOGJjNTdmMmY1MTRlYTQ4NDU3YzUzYzBiNjY4NDliMzJhNTE3MWFjNDg0NGQ3NDg2YjZiMGIyNDdkNDkyMjVhMDg2Y2RkMzY2OWFjODg4NGUyMmQ4ZTE3MWE2MjdiMDI0NTI2YzVkNDU4NTc2MzcxNjYxNjhmNWRlODk4M2JhYjM3ZDUzYjEzMGY1YWVjNWUxYzQ1MTFmNGU1M2Q1NTg4OTFcIixcbiAgICBDOlwiMTJmNTkyMWRlZDk0NDc5NmQ1OTEyNjM2NTE4NTVkYmQ0MWE3YjlhYWI4NWU4NGFlYWE3ZDI3NDY5MWIwMGJiZTYxMmE2OWEzYzliODY0YmQzMTE2YTk0NDk2ZjIzYmEyMTYzMTRhMjBhZjAyODNkMDRmMjg5ODIwMzQ1OTZkYmUyNzgxMzFkMTQ2MGU4ZDRhZDJlYjMzYjlhYWZiYmNlZWQzYTEyNGQ2MDc5YWQ4NmU1ZGQ4OGIwOGQ4M2M3OTQzZjc2Nzc5ZjMxYTBhMjU1ZDdkYzQ4Y2Y1ZTMwZGQwNWQ0ZTJiZTY0OTQ1Mzk2YTY4OTU3NjQ0MzIxNGE0NDc4NlwiLFxuICAgfTtcbm1vZHVsZS5leHBvcnRzPWtleTtcbiIsIi8qKlxuICogdGFrZW4gZnJvbSBodHRwOi8vd3d3LWNzLXN0dWRlbnRzLnN0YW5mb3JkLmVkdS9+dGp3L2pzYm4vXG4gKiBCU0QgbGljZW5zZVxuICBUaGlzIHNvZnR3YXJlIGlzIGNvdmVyZWQgdW5kZXIgdGhlIGZvbGxvd2luZyBjb3B5cmlnaHQ6XG5cbiAqIENvcHlyaWdodCAoYykgMjAwMy0yMDA1ICBUb20gV3VcbiAqIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nXG4gKiBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbiAqIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuICogd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuICogZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG9cbiAqIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMtSVNcIiBBTkQgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAqIEVYUFJFU1MsIElNUExJRUQgT1IgT1RIRVJXSVNFLCBJTkNMVURJTkcgV0lUSE9VVCBMSU1JVEFUSU9OLCBBTllcbiAqIFdBUlJBTlRZIE9GIE1FUkNIQU5UQUJJTElUWSBPUiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS5cbiAqXG4gKiBJTiBOTyBFVkVOVCBTSEFMTCBUT00gV1UgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgSU5DSURFTlRBTCxcbiAqIElORElSRUNUIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyBPRiBBTlkgS0lORCwgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUlxuICogUkVTVUxUSU5HIEZST00gTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBPUiBOT1QgQURWSVNFRCBPRlxuICogVEhFIFBPU1NJQklMSVRZIE9GIERBTUFHRSwgQU5EIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLCBBUklTSU5HIE9VVFxuICogT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBVU0UgT1IgUEVSRk9STUFOQ0UgT0YgVEhJUyBTT0ZUV0FSRS5cbiAqXG4gKiBJbiBhZGRpdGlvbiwgdGhlIGZvbGxvd2luZyBjb25kaXRpb24gYXBwbGllczpcbiAqXG4gKiBBbGwgcmVkaXN0cmlidXRpb25zIG11c3QgcmV0YWluIGFuIGludGFjdCBjb3B5IG9mIHRoaXMgY29weXJpZ2h0IG5vdGljZVxuICogYW5kIGRpc2NsYWltZXIuXG5cbiAgICBBZGRyZXNzIGFsbCBxdWVzdGlvbnMgcmVnYXJkaW5nIHRoaXMgbGljZW5zZSB0bzpcblxuICAgIFRvbSBXdVxuICAgIHRqd0Bjcy5TdGFuZm9yZC5FRFVcbiAqXG4gKlxuICovXG5cbi8qKlxuICogYWxsIG5lY2Vzc2FyeSBmaWxlcyBjb2xsZWN0ZWQgaW50byB0aGlzIGZpbGVcbiAqL1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBqc2JuLmpzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIENvcHlyaWdodCAoYykgMjAwNSAgVG9tIFd1XG4vLyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy8gU2VlIFwiTElDRU5TRVwiIGZvciBkZXRhaWxzLlxuXG4vLyBCYXNpYyBKYXZhU2NyaXB0IEJOIGxpYnJhcnkgLSBzdWJzZXQgdXNlZnVsIGZvciBSU0EgZW5jcnlwdGlvbi5cblxuLy8gQml0cyBwZXIgZGlnaXRcbnZhciBkYml0cztcblxuLy8gSmF2YVNjcmlwdCBlbmdpbmUgYW5hbHlzaXNcbnZhciBjYW5hcnkgPSAweGRlYWRiZWVmY2FmZTtcbnZhciBqX2xtID0gKChjYW5hcnkmMHhmZmZmZmYpPT0weGVmY2FmZSk7XG5cbi8vIChwdWJsaWMpIENvbnN0cnVjdG9yXG5mdW5jdGlvbiBCaWdJbnRlZ2VyKGEsYixjKSB7XG4gICAgaWYoYSAhPSBudWxsKVxuICAgICAgICBpZihcIm51bWJlclwiID09IHR5cGVvZiBhKSB0aGlzLmZyb21OdW1iZXIoYSxiLGMpO1xuICAgICAgICBlbHNlIGlmKGIgPT0gbnVsbCAmJiBcInN0cmluZ1wiICE9IHR5cGVvZiBhKSB0aGlzLmZyb21TdHJpbmcoYSwyNTYpO1xuICAgICAgICBlbHNlIHRoaXMuZnJvbVN0cmluZyhhLGIpO1xufVxuXG4vLyByZXR1cm4gbmV3LCB1bnNldCBCaWdJbnRlZ2VyXG5mdW5jdGlvbiBuYmkoKSB7IHJldHVybiBuZXcgQmlnSW50ZWdlcihudWxsKTsgfVxuXG4vLyBhbTogQ29tcHV0ZSB3X2ogKz0gKHgqdGhpc19pKSwgcHJvcGFnYXRlIGNhcnJpZXMsXG4vLyBjIGlzIGluaXRpYWwgY2FycnksIHJldHVybnMgZmluYWwgY2FycnkuXG4vLyBjIDwgMypkdmFsdWUsIHggPCAyKmR2YWx1ZSwgdGhpc19pIDwgZHZhbHVlXG4vLyBXZSBuZWVkIHRvIHNlbGVjdCB0aGUgZmFzdGVzdCBvbmUgdGhhdCB3b3JrcyBpbiB0aGlzIGVudmlyb25tZW50LlxuXG4vLyBhbTE6IHVzZSBhIHNpbmdsZSBtdWx0IGFuZCBkaXZpZGUgdG8gZ2V0IHRoZSBoaWdoIGJpdHMsXG4vLyBtYXggZGlnaXQgYml0cyBzaG91bGQgYmUgMjYgYmVjYXVzZVxuLy8gbWF4IGludGVybmFsIHZhbHVlID0gMipkdmFsdWVeMi0yKmR2YWx1ZSAoPCAyXjUzKVxuZnVuY3Rpb24gYW0xKGkseCx3LGosYyxuKSB7XG4gICAgd2hpbGUoLS1uID49IDApIHtcbiAgICAgICAgdmFyIHYgPSB4KnRoaXNbaSsrXSt3W2pdK2M7XG4gICAgICAgIGMgPSBNYXRoLmZsb29yKHYvMHg0MDAwMDAwKTtcbiAgICAgICAgd1tqKytdID0gdiYweDNmZmZmZmY7XG4gICAgfVxuICAgIHJldHVybiBjO1xufVxuLy8gYW0yIGF2b2lkcyBhIGJpZyBtdWx0LWFuZC1leHRyYWN0IGNvbXBsZXRlbHkuXG4vLyBNYXggZGlnaXQgYml0cyBzaG91bGQgYmUgPD0gMzAgYmVjYXVzZSB3ZSBkbyBiaXR3aXNlIG9wc1xuLy8gb24gdmFsdWVzIHVwIHRvIDIqaGR2YWx1ZV4yLWhkdmFsdWUtMSAoPCAyXjMxKVxuZnVuY3Rpb24gYW0yKGkseCx3LGosYyxuKSB7XG4gICAgdmFyIHhsID0geCYweDdmZmYsIHhoID0geD4+MTU7XG4gICAgd2hpbGUoLS1uID49IDApIHtcbiAgICAgICAgdmFyIGwgPSB0aGlzW2ldJjB4N2ZmZjtcbiAgICAgICAgdmFyIGggPSB0aGlzW2krK10+PjE1O1xuICAgICAgICB2YXIgbSA9IHhoKmwraCp4bDtcbiAgICAgICAgbCA9IHhsKmwrKChtJjB4N2ZmZik8PDE1KSt3W2pdKyhjJjB4M2ZmZmZmZmYpO1xuICAgICAgICBjID0gKGw+Pj4zMCkrKG0+Pj4xNSkreGgqaCsoYz4+PjMwKTtcbiAgICAgICAgd1tqKytdID0gbCYweDNmZmZmZmZmO1xuICAgIH1cbiAgICByZXR1cm4gYztcbn1cbi8vIEFsdGVybmF0ZWx5LCBzZXQgbWF4IGRpZ2l0IGJpdHMgdG8gMjggc2luY2Ugc29tZVxuLy8gYnJvd3NlcnMgc2xvdyBkb3duIHdoZW4gZGVhbGluZyB3aXRoIDMyLWJpdCBudW1iZXJzLlxuZnVuY3Rpb24gYW0zKGkseCx3LGosYyxuKSB7XG4gICAgdmFyIHhsID0geCYweDNmZmYsIHhoID0geD4+MTQ7XG4gICAgd2hpbGUoLS1uID49IDApIHtcbiAgICAgICAgdmFyIGwgPSB0aGlzW2ldJjB4M2ZmZjtcbiAgICAgICAgdmFyIGggPSB0aGlzW2krK10+PjE0O1xuICAgICAgICB2YXIgbSA9IHhoKmwraCp4bDtcbiAgICAgICAgbCA9IHhsKmwrKChtJjB4M2ZmZik8PDE0KSt3W2pdK2M7XG4gICAgICAgIGMgPSAobD4+MjgpKyhtPj4xNCkreGgqaDtcbiAgICAgICAgd1tqKytdID0gbCYweGZmZmZmZmY7XG4gICAgfVxuICAgIHJldHVybiBjO1xufVxuaWYoal9sbSAmJiAobmF2aWdhdG9yLmFwcE5hbWUgPT0gXCJNaWNyb3NvZnQgSW50ZXJuZXQgRXhwbG9yZXJcIikpIHtcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hbSA9IGFtMjtcbiAgICBkYml0cyA9IDMwO1xufVxuZWxzZSBpZihqX2xtICYmIChuYXZpZ2F0b3IuYXBwTmFtZSAhPSBcIk5ldHNjYXBlXCIpKSB7XG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuYW0gPSBhbTE7XG4gICAgZGJpdHMgPSAyNjtcbn1cbmVsc2UgeyAvLyBNb3ppbGxhL05ldHNjYXBlIHNlZW1zIHRvIHByZWZlciBhbTNcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hbSA9IGFtMztcbiAgICBkYml0cyA9IDI4O1xufVxuXG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5EQiA9IGRiaXRzO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuRE0gPSAoKDE8PGRiaXRzKS0xKTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLkRWID0gKDE8PGRiaXRzKTtcblxudmFyIEJJX0ZQID0gNTI7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5GViA9IE1hdGgucG93KDIsQklfRlApO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuRjEgPSBCSV9GUC1kYml0cztcbkJpZ0ludGVnZXIucHJvdG90eXBlLkYyID0gMipkYml0cy1CSV9GUDtcblxuLy8gRGlnaXQgY29udmVyc2lvbnNcbnZhciBCSV9STSA9IFwiMDEyMzQ1Njc4OWFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6XCI7XG52YXIgQklfUkMgPSBuZXcgQXJyYXkoKTtcbnZhciBycix2djtcbnJyID0gXCIwXCIuY2hhckNvZGVBdCgwKTtcbmZvcih2diA9IDA7IHZ2IDw9IDk7ICsrdnYpIEJJX1JDW3JyKytdID0gdnY7XG5yciA9IFwiYVwiLmNoYXJDb2RlQXQoMCk7XG5mb3IodnYgPSAxMDsgdnYgPCAzNjsgKyt2dikgQklfUkNbcnIrK10gPSB2djtcbnJyID0gXCJBXCIuY2hhckNvZGVBdCgwKTtcbmZvcih2diA9IDEwOyB2diA8IDM2OyArK3Z2KSBCSV9SQ1tycisrXSA9IHZ2O1xuXG5mdW5jdGlvbiBpbnQyY2hhcihuKSB7IHJldHVybiBCSV9STS5jaGFyQXQobik7IH1cbmZ1bmN0aW9uIGludEF0KHMsaSkge1xuICAgIHZhciBjID0gQklfUkNbcy5jaGFyQ29kZUF0KGkpXTtcbiAgICByZXR1cm4gKGM9PW51bGwpPy0xOmM7XG59XG5cbi8vIChwcm90ZWN0ZWQpIGNvcHkgdGhpcyB0byByXG5mdW5jdGlvbiBibnBDb3B5VG8ocikge1xuICAgIGZvcih2YXIgaSA9IHRoaXMudC0xOyBpID49IDA7IC0taSkgcltpXSA9IHRoaXNbaV07XG4gICAgci50ID0gdGhpcy50O1xuICAgIHIucyA9IHRoaXMucztcbn1cblxuLy8gKHByb3RlY3RlZCkgc2V0IGZyb20gaW50ZWdlciB2YWx1ZSB4LCAtRFYgPD0geCA8IERWXG5mdW5jdGlvbiBibnBGcm9tSW50KHgpIHtcbiAgICB0aGlzLnQgPSAxO1xuICAgIHRoaXMucyA9ICh4PDApPy0xOjA7XG4gICAgaWYoeCA+IDApIHRoaXNbMF0gPSB4O1xuICAgIGVsc2UgaWYoeCA8IC0xKSB0aGlzWzBdID0geCt0aGlzLkRWO1xuICAgIGVsc2UgdGhpcy50ID0gMDtcbn1cblxuLy8gcmV0dXJuIGJpZ2ludCBpbml0aWFsaXplZCB0byB2YWx1ZVxuZnVuY3Rpb24gbmJ2KGkpIHsgdmFyIHIgPSBuYmkoKTsgci5mcm9tSW50KGkpOyByZXR1cm4gcjsgfVxuXG4vLyAocHJvdGVjdGVkKSBzZXQgZnJvbSBzdHJpbmcgYW5kIHJhZGl4XG5mdW5jdGlvbiBibnBGcm9tU3RyaW5nKHMsYikge1xuICAgIHZhciBrO1xuICAgIGlmKGIgPT0gMTYpIGsgPSA0O1xuICAgIGVsc2UgaWYoYiA9PSA4KSBrID0gMztcbiAgICBlbHNlIGlmKGIgPT0gMjU2KSBrID0gODsgLy8gYnl0ZSBhcnJheVxuICAgIGVsc2UgaWYoYiA9PSAyKSBrID0gMTtcbiAgICBlbHNlIGlmKGIgPT0gMzIpIGsgPSA1O1xuICAgIGVsc2UgaWYoYiA9PSA0KSBrID0gMjtcbiAgICBlbHNlIHsgdGhpcy5mcm9tUmFkaXgocyxiKTsgcmV0dXJuOyB9XG4gICAgdGhpcy50ID0gMDtcbiAgICB0aGlzLnMgPSAwO1xuICAgIHZhciBpID0gcy5sZW5ndGgsIG1pID0gZmFsc2UsIHNoID0gMDtcbiAgICB3aGlsZSgtLWkgPj0gMCkge1xuICAgICAgICB2YXIgeCA9IChrPT04KT9zW2ldJjB4ZmY6aW50QXQocyxpKTtcbiAgICAgICAgaWYoeCA8IDApIHtcbiAgICAgICAgICAgIGlmKHMuY2hhckF0KGkpID09IFwiLVwiKSBtaSA9IHRydWU7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBtaSA9IGZhbHNlO1xuICAgICAgICBpZihzaCA9PSAwKVxuICAgICAgICAgICAgdGhpc1t0aGlzLnQrK10gPSB4O1xuICAgICAgICBlbHNlIGlmKHNoK2sgPiB0aGlzLkRCKSB7XG4gICAgICAgICAgICB0aGlzW3RoaXMudC0xXSB8PSAoeCYoKDE8PCh0aGlzLkRCLXNoKSktMSkpPDxzaDtcbiAgICAgICAgICAgIHRoaXNbdGhpcy50KytdID0gKHg+Pih0aGlzLkRCLXNoKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpc1t0aGlzLnQtMV0gfD0geDw8c2g7XG4gICAgICAgIHNoICs9IGs7XG4gICAgICAgIGlmKHNoID49IHRoaXMuREIpIHNoIC09IHRoaXMuREI7XG4gICAgfVxuICAgIGlmKGsgPT0gOCAmJiAoc1swXSYweDgwKSAhPSAwKSB7XG4gICAgICAgIHRoaXMucyA9IC0xO1xuICAgICAgICBpZihzaCA+IDApIHRoaXNbdGhpcy50LTFdIHw9ICgoMTw8KHRoaXMuREItc2gpKS0xKTw8c2g7XG4gICAgfVxuICAgIHRoaXMuY2xhbXAoKTtcbiAgICBpZihtaSkgQmlnSW50ZWdlci5aRVJPLnN1YlRvKHRoaXMsdGhpcyk7XG59XG5cbi8vIChwcm90ZWN0ZWQpIGNsYW1wIG9mZiBleGNlc3MgaGlnaCB3b3Jkc1xuZnVuY3Rpb24gYm5wQ2xhbXAoKSB7XG4gICAgdmFyIGMgPSB0aGlzLnMmdGhpcy5ETTtcbiAgICB3aGlsZSh0aGlzLnQgPiAwICYmIHRoaXNbdGhpcy50LTFdID09IGMpIC0tdGhpcy50O1xufVxuXG4vLyAocHVibGljKSByZXR1cm4gc3RyaW5nIHJlcHJlc2VudGF0aW9uIGluIGdpdmVuIHJhZGl4XG5mdW5jdGlvbiBiblRvU3RyaW5nKGIpIHtcbiAgICBpZih0aGlzLnMgPCAwKSByZXR1cm4gXCItXCIrdGhpcy5uZWdhdGUoKS50b1N0cmluZyhiKTtcbiAgICB2YXIgaztcbiAgICBpZihiID09IDE2KSBrID0gNDtcbiAgICBlbHNlIGlmKGIgPT0gOCkgayA9IDM7XG4gICAgZWxzZSBpZihiID09IDIpIGsgPSAxO1xuICAgIGVsc2UgaWYoYiA9PSAzMikgayA9IDU7XG4gICAgZWxzZSBpZihiID09IDQpIGsgPSAyO1xuICAgIGVsc2UgcmV0dXJuIHRoaXMudG9SYWRpeChiKTtcbiAgICB2YXIga20gPSAoMTw8ayktMSwgZCwgbSA9IGZhbHNlLCByID0gXCJcIiwgaSA9IHRoaXMudDtcbiAgICB2YXIgcCA9IHRoaXMuREItKGkqdGhpcy5EQiklaztcbiAgICBpZihpLS0gPiAwKSB7XG4gICAgICAgIGlmKHAgPCB0aGlzLkRCICYmIChkID0gdGhpc1tpXT4+cCkgPiAwKSB7IG0gPSB0cnVlOyByID0gaW50MmNoYXIoZCk7IH1cbiAgICAgICAgd2hpbGUoaSA+PSAwKSB7XG4gICAgICAgICAgICBpZihwIDwgaykge1xuICAgICAgICAgICAgICAgIGQgPSAodGhpc1tpXSYoKDE8PHApLTEpKTw8KGstcCk7XG4gICAgICAgICAgICAgICAgZCB8PSB0aGlzWy0taV0+PihwKz10aGlzLkRCLWspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZCA9ICh0aGlzW2ldPj4ocC09aykpJmttO1xuICAgICAgICAgICAgICAgIGlmKHAgPD0gMCkgeyBwICs9IHRoaXMuREI7IC0taTsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZCA+IDApIG0gPSB0cnVlO1xuICAgICAgICAgICAgaWYobSkgciArPSBpbnQyY2hhcihkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbT9yOlwiMFwiO1xufVxuXG4vLyAocHVibGljKSAtdGhpc1xuZnVuY3Rpb24gYm5OZWdhdGUoKSB7IHZhciByID0gbmJpKCk7IEJpZ0ludGVnZXIuWkVSTy5zdWJUbyh0aGlzLHIpOyByZXR1cm4gcjsgfVxuXG4vLyAocHVibGljKSB8dGhpc3xcbmZ1bmN0aW9uIGJuQWJzKCkgeyByZXR1cm4gKHRoaXMuczwwKT90aGlzLm5lZ2F0ZSgpOnRoaXM7IH1cblxuLy8gKHB1YmxpYykgcmV0dXJuICsgaWYgdGhpcyA+IGEsIC0gaWYgdGhpcyA8IGEsIDAgaWYgZXF1YWxcbmZ1bmN0aW9uIGJuQ29tcGFyZVRvKGEpIHtcbiAgICB2YXIgciA9IHRoaXMucy1hLnM7XG4gICAgaWYociAhPSAwKSByZXR1cm4gcjtcbiAgICB2YXIgaSA9IHRoaXMudDtcbiAgICByID0gaS1hLnQ7XG4gICAgaWYociAhPSAwKSByZXR1cm4gKHRoaXMuczwwKT8tcjpyO1xuICAgIHdoaWxlKC0taSA+PSAwKSBpZigocj10aGlzW2ldLWFbaV0pICE9IDApIHJldHVybiByO1xuICAgIHJldHVybiAwO1xufVxuXG4vLyByZXR1cm5zIGJpdCBsZW5ndGggb2YgdGhlIGludGVnZXIgeFxuZnVuY3Rpb24gbmJpdHMoeCkge1xuICAgIHZhciByID0gMSwgdDtcbiAgICBpZigodD14Pj4+MTYpICE9IDApIHsgeCA9IHQ7IHIgKz0gMTY7IH1cbiAgICBpZigodD14Pj44KSAhPSAwKSB7IHggPSB0OyByICs9IDg7IH1cbiAgICBpZigodD14Pj40KSAhPSAwKSB7IHggPSB0OyByICs9IDQ7IH1cbiAgICBpZigodD14Pj4yKSAhPSAwKSB7IHggPSB0OyByICs9IDI7IH1cbiAgICBpZigodD14Pj4xKSAhPSAwKSB7IHggPSB0OyByICs9IDE7IH1cbiAgICByZXR1cm4gcjtcbn1cblxuLy8gKHB1YmxpYykgcmV0dXJuIHRoZSBudW1iZXIgb2YgYml0cyBpbiBcInRoaXNcIlxuZnVuY3Rpb24gYm5CaXRMZW5ndGgoKSB7XG4gICAgaWYodGhpcy50IDw9IDApIHJldHVybiAwO1xuICAgIHJldHVybiB0aGlzLkRCKih0aGlzLnQtMSkrbmJpdHModGhpc1t0aGlzLnQtMV1eKHRoaXMucyZ0aGlzLkRNKSk7XG59XG5cbi8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzIDw8IG4qREJcbmZ1bmN0aW9uIGJucERMU2hpZnRUbyhuLHIpIHtcbiAgICB2YXIgaTtcbiAgICBmb3IoaSA9IHRoaXMudC0xOyBpID49IDA7IC0taSkgcltpK25dID0gdGhpc1tpXTtcbiAgICBmb3IoaSA9IG4tMTsgaSA+PSAwOyAtLWkpIHJbaV0gPSAwO1xuICAgIHIudCA9IHRoaXMudCtuO1xuICAgIHIucyA9IHRoaXMucztcbn1cblxuLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgPj4gbipEQlxuZnVuY3Rpb24gYm5wRFJTaGlmdFRvKG4scikge1xuICAgIGZvcih2YXIgaSA9IG47IGkgPCB0aGlzLnQ7ICsraSkgcltpLW5dID0gdGhpc1tpXTtcbiAgICByLnQgPSBNYXRoLm1heCh0aGlzLnQtbiwwKTtcbiAgICByLnMgPSB0aGlzLnM7XG59XG5cbi8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzIDw8IG5cbmZ1bmN0aW9uIGJucExTaGlmdFRvKG4scikge1xuICAgIHZhciBicyA9IG4ldGhpcy5EQjtcbiAgICB2YXIgY2JzID0gdGhpcy5EQi1icztcbiAgICB2YXIgYm0gPSAoMTw8Y2JzKS0xO1xuICAgIHZhciBkcyA9IE1hdGguZmxvb3Iobi90aGlzLkRCKSwgYyA9ICh0aGlzLnM8PGJzKSZ0aGlzLkRNLCBpO1xuICAgIGZvcihpID0gdGhpcy50LTE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgIHJbaStkcysxXSA9ICh0aGlzW2ldPj5jYnMpfGM7XG4gICAgICAgIGMgPSAodGhpc1tpXSZibSk8PGJzO1xuICAgIH1cbiAgICBmb3IoaSA9IGRzLTE7IGkgPj0gMDsgLS1pKSByW2ldID0gMDtcbiAgICByW2RzXSA9IGM7XG4gICAgci50ID0gdGhpcy50K2RzKzE7XG4gICAgci5zID0gdGhpcy5zO1xuICAgIHIuY2xhbXAoKTtcbn1cblxuLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgPj4gblxuZnVuY3Rpb24gYm5wUlNoaWZ0VG8obixyKSB7XG4gICAgci5zID0gdGhpcy5zO1xuICAgIHZhciBkcyA9IE1hdGguZmxvb3Iobi90aGlzLkRCKTtcbiAgICBpZihkcyA+PSB0aGlzLnQpIHsgci50ID0gMDsgcmV0dXJuOyB9XG4gICAgdmFyIGJzID0gbiV0aGlzLkRCO1xuICAgIHZhciBjYnMgPSB0aGlzLkRCLWJzO1xuICAgIHZhciBibSA9ICgxPDxicyktMTtcbiAgICByWzBdID0gdGhpc1tkc10+PmJzO1xuICAgIGZvcih2YXIgaSA9IGRzKzE7IGkgPCB0aGlzLnQ7ICsraSkge1xuICAgICAgICByW2ktZHMtMV0gfD0gKHRoaXNbaV0mYm0pPDxjYnM7XG4gICAgICAgIHJbaS1kc10gPSB0aGlzW2ldPj5icztcbiAgICB9XG4gICAgaWYoYnMgPiAwKSByW3RoaXMudC1kcy0xXSB8PSAodGhpcy5zJmJtKTw8Y2JzO1xuICAgIHIudCA9IHRoaXMudC1kcztcbiAgICByLmNsYW1wKCk7XG59XG5cbi8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzIC0gYVxuZnVuY3Rpb24gYm5wU3ViVG8oYSxyKSB7XG4gICAgdmFyIGkgPSAwLCBjID0gMCwgbSA9IE1hdGgubWluKGEudCx0aGlzLnQpO1xuICAgIHdoaWxlKGkgPCBtKSB7XG4gICAgICAgIGMgKz0gdGhpc1tpXS1hW2ldO1xuICAgICAgICByW2krK10gPSBjJnRoaXMuRE07XG4gICAgICAgIGMgPj49IHRoaXMuREI7XG4gICAgfVxuICAgIGlmKGEudCA8IHRoaXMudCkge1xuICAgICAgICBjIC09IGEucztcbiAgICAgICAgd2hpbGUoaSA8IHRoaXMudCkge1xuICAgICAgICAgICAgYyArPSB0aGlzW2ldO1xuICAgICAgICAgICAgcltpKytdID0gYyZ0aGlzLkRNO1xuICAgICAgICAgICAgYyA+Pj0gdGhpcy5EQjtcbiAgICAgICAgfVxuICAgICAgICBjICs9IHRoaXMucztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGMgKz0gdGhpcy5zO1xuICAgICAgICB3aGlsZShpIDwgYS50KSB7XG4gICAgICAgICAgICBjIC09IGFbaV07XG4gICAgICAgICAgICByW2krK10gPSBjJnRoaXMuRE07XG4gICAgICAgICAgICBjID4+PSB0aGlzLkRCO1xuICAgICAgICB9XG4gICAgICAgIGMgLT0gYS5zO1xuICAgIH1cbiAgICByLnMgPSAoYzwwKT8tMTowO1xuICAgIGlmKGMgPCAtMSkgcltpKytdID0gdGhpcy5EVitjO1xuICAgIGVsc2UgaWYoYyA+IDApIHJbaSsrXSA9IGM7XG4gICAgci50ID0gaTtcbiAgICByLmNsYW1wKCk7XG59XG5cbi8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzICogYSwgciAhPSB0aGlzLGEgKEhBQyAxNC4xMilcbi8vIFwidGhpc1wiIHNob3VsZCBiZSB0aGUgbGFyZ2VyIG9uZSBpZiBhcHByb3ByaWF0ZS5cbmZ1bmN0aW9uIGJucE11bHRpcGx5VG8oYSxyKSB7XG4gICAgdmFyIHggPSB0aGlzLmFicygpLCB5ID0gYS5hYnMoKTtcbiAgICB2YXIgaSA9IHgudDtcbiAgICByLnQgPSBpK3kudDtcbiAgICB3aGlsZSgtLWkgPj0gMCkgcltpXSA9IDA7XG4gICAgZm9yKGkgPSAwOyBpIDwgeS50OyArK2kpIHJbaSt4LnRdID0geC5hbSgwLHlbaV0scixpLDAseC50KTtcbiAgICByLnMgPSAwO1xuICAgIHIuY2xhbXAoKTtcbiAgICBpZih0aGlzLnMgIT0gYS5zKSBCaWdJbnRlZ2VyLlpFUk8uc3ViVG8ocixyKTtcbn1cblxuLy8gKHByb3RlY3RlZCkgciA9IHRoaXNeMiwgciAhPSB0aGlzIChIQUMgMTQuMTYpXG5mdW5jdGlvbiBibnBTcXVhcmVUbyhyKSB7XG4gICAgdmFyIHggPSB0aGlzLmFicygpO1xuICAgIHZhciBpID0gci50ID0gMip4LnQ7XG4gICAgd2hpbGUoLS1pID49IDApIHJbaV0gPSAwO1xuICAgIGZvcihpID0gMDsgaSA8IHgudC0xOyArK2kpIHtcbiAgICAgICAgdmFyIGMgPSB4LmFtKGkseFtpXSxyLDIqaSwwLDEpO1xuICAgICAgICBpZigocltpK3gudF0rPXguYW0oaSsxLDIqeFtpXSxyLDIqaSsxLGMseC50LWktMSkpID49IHguRFYpIHtcbiAgICAgICAgICAgIHJbaSt4LnRdIC09IHguRFY7XG4gICAgICAgICAgICByW2kreC50KzFdID0gMTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZihyLnQgPiAwKSByW3IudC0xXSArPSB4LmFtKGkseFtpXSxyLDIqaSwwLDEpO1xuICAgIHIucyA9IDA7XG4gICAgci5jbGFtcCgpO1xufVxuXG4vLyAocHJvdGVjdGVkKSBkaXZpZGUgdGhpcyBieSBtLCBxdW90aWVudCBhbmQgcmVtYWluZGVyIHRvIHEsIHIgKEhBQyAxNC4yMClcbi8vIHIgIT0gcSwgdGhpcyAhPSBtLiAgcSBvciByIG1heSBiZSBudWxsLlxuZnVuY3Rpb24gYm5wRGl2UmVtVG8obSxxLHIpIHtcbiAgICB2YXIgcG0gPSBtLmFicygpO1xuICAgIGlmKHBtLnQgPD0gMCkgcmV0dXJuO1xuICAgIHZhciBwdCA9IHRoaXMuYWJzKCk7XG4gICAgaWYocHQudCA8IHBtLnQpIHtcbiAgICAgICAgaWYocSAhPSBudWxsKSBxLmZyb21JbnQoMCk7XG4gICAgICAgIGlmKHIgIT0gbnVsbCkgdGhpcy5jb3B5VG8ocik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYociA9PSBudWxsKSByID0gbmJpKCk7XG4gICAgdmFyIHkgPSBuYmkoKSwgdHMgPSB0aGlzLnMsIG1zID0gbS5zO1xuICAgIHZhciBuc2ggPSB0aGlzLkRCLW5iaXRzKHBtW3BtLnQtMV0pO1x0Ly8gbm9ybWFsaXplIG1vZHVsdXNcbiAgICBpZihuc2ggPiAwKSB7IHBtLmxTaGlmdFRvKG5zaCx5KTsgcHQubFNoaWZ0VG8obnNoLHIpOyB9XG4gICAgZWxzZSB7IHBtLmNvcHlUbyh5KTsgcHQuY29weVRvKHIpOyB9XG4gICAgdmFyIHlzID0geS50O1xuICAgIHZhciB5MCA9IHlbeXMtMV07XG4gICAgaWYoeTAgPT0gMCkgcmV0dXJuO1xuICAgIHZhciB5dCA9IHkwKigxPDx0aGlzLkYxKSsoKHlzPjEpP3lbeXMtMl0+PnRoaXMuRjI6MCk7XG4gICAgdmFyIGQxID0gdGhpcy5GVi95dCwgZDIgPSAoMTw8dGhpcy5GMSkveXQsIGUgPSAxPDx0aGlzLkYyO1xuICAgIHZhciBpID0gci50LCBqID0gaS15cywgdCA9IChxPT1udWxsKT9uYmkoKTpxO1xuICAgIHkuZGxTaGlmdFRvKGosdCk7XG4gICAgaWYoci5jb21wYXJlVG8odCkgPj0gMCkge1xuICAgICAgICByW3IudCsrXSA9IDE7XG4gICAgICAgIHIuc3ViVG8odCxyKTtcbiAgICB9XG4gICAgQmlnSW50ZWdlci5PTkUuZGxTaGlmdFRvKHlzLHQpO1xuICAgIHQuc3ViVG8oeSx5KTtcdC8vIFwibmVnYXRpdmVcIiB5IHNvIHdlIGNhbiByZXBsYWNlIHN1YiB3aXRoIGFtIGxhdGVyXG4gICAgd2hpbGUoeS50IDwgeXMpIHlbeS50KytdID0gMDtcbiAgICB3aGlsZSgtLWogPj0gMCkge1xuICAgICAgICAvLyBFc3RpbWF0ZSBxdW90aWVudCBkaWdpdFxuICAgICAgICB2YXIgcWQgPSAoclstLWldPT15MCk/dGhpcy5ETTpNYXRoLmZsb29yKHJbaV0qZDErKHJbaS0xXStlKSpkMik7XG4gICAgICAgIGlmKChyW2ldKz15LmFtKDAscWQscixqLDAseXMpKSA8IHFkKSB7XHQvLyBUcnkgaXQgb3V0XG4gICAgICAgICAgICB5LmRsU2hpZnRUbyhqLHQpO1xuICAgICAgICAgICAgci5zdWJUbyh0LHIpO1xuICAgICAgICAgICAgd2hpbGUocltpXSA8IC0tcWQpIHIuc3ViVG8odCxyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZihxICE9IG51bGwpIHtcbiAgICAgICAgci5kclNoaWZ0VG8oeXMscSk7XG4gICAgICAgIGlmKHRzICE9IG1zKSBCaWdJbnRlZ2VyLlpFUk8uc3ViVG8ocSxxKTtcbiAgICB9XG4gICAgci50ID0geXM7XG4gICAgci5jbGFtcCgpO1xuICAgIGlmKG5zaCA+IDApIHIuclNoaWZ0VG8obnNoLHIpO1x0Ly8gRGVub3JtYWxpemUgcmVtYWluZGVyXG4gICAgaWYodHMgPCAwKSBCaWdJbnRlZ2VyLlpFUk8uc3ViVG8ocixyKTtcbn1cblxuLy8gKHB1YmxpYykgdGhpcyBtb2QgYVxuZnVuY3Rpb24gYm5Nb2QoYSkge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgdGhpcy5hYnMoKS5kaXZSZW1UbyhhLG51bGwscik7XG4gICAgaWYodGhpcy5zIDwgMCAmJiByLmNvbXBhcmVUbyhCaWdJbnRlZ2VyLlpFUk8pID4gMCkgYS5zdWJUbyhyLHIpO1xuICAgIHJldHVybiByO1xufVxuXG4vLyBNb2R1bGFyIHJlZHVjdGlvbiB1c2luZyBcImNsYXNzaWNcIiBhbGdvcml0aG1cbmZ1bmN0aW9uIENsYXNzaWMobSkgeyB0aGlzLm0gPSBtOyB9XG5mdW5jdGlvbiBjQ29udmVydCh4KSB7XG4gICAgaWYoeC5zIDwgMCB8fCB4LmNvbXBhcmVUbyh0aGlzLm0pID49IDApIHJldHVybiB4Lm1vZCh0aGlzLm0pO1xuICAgIGVsc2UgcmV0dXJuIHg7XG59XG5mdW5jdGlvbiBjUmV2ZXJ0KHgpIHsgcmV0dXJuIHg7IH1cbmZ1bmN0aW9uIGNSZWR1Y2UoeCkgeyB4LmRpdlJlbVRvKHRoaXMubSxudWxsLHgpOyB9XG5mdW5jdGlvbiBjTXVsVG8oeCx5LHIpIHsgeC5tdWx0aXBseVRvKHkscik7IHRoaXMucmVkdWNlKHIpOyB9XG5mdW5jdGlvbiBjU3FyVG8oeCxyKSB7IHguc3F1YXJlVG8ocik7IHRoaXMucmVkdWNlKHIpOyB9XG5cbkNsYXNzaWMucHJvdG90eXBlLmNvbnZlcnQgPSBjQ29udmVydDtcbkNsYXNzaWMucHJvdG90eXBlLnJldmVydCA9IGNSZXZlcnQ7XG5DbGFzc2ljLnByb3RvdHlwZS5yZWR1Y2UgPSBjUmVkdWNlO1xuQ2xhc3NpYy5wcm90b3R5cGUubXVsVG8gPSBjTXVsVG87XG5DbGFzc2ljLnByb3RvdHlwZS5zcXJUbyA9IGNTcXJUbztcblxuLy8gKHByb3RlY3RlZCkgcmV0dXJuIFwiLTEvdGhpcyAlIDJeREJcIjsgdXNlZnVsIGZvciBNb250LiByZWR1Y3Rpb25cbi8vIGp1c3RpZmljYXRpb246XG4vLyAgICAgICAgIHh5ID09IDEgKG1vZCBtKVxuLy8gICAgICAgICB4eSA9ICAxK2ttXG4vLyAgIHh5KDIteHkpID0gKDEra20pKDEta20pXG4vLyB4W3koMi14eSldID0gMS1rXjJtXjJcbi8vIHhbeSgyLXh5KV0gPT0gMSAobW9kIG1eMilcbi8vIGlmIHkgaXMgMS94IG1vZCBtLCB0aGVuIHkoMi14eSkgaXMgMS94IG1vZCBtXjJcbi8vIHNob3VsZCByZWR1Y2UgeCBhbmQgeSgyLXh5KSBieSBtXjIgYXQgZWFjaCBzdGVwIHRvIGtlZXAgc2l6ZSBib3VuZGVkLlxuLy8gSlMgbXVsdGlwbHkgXCJvdmVyZmxvd3NcIiBkaWZmZXJlbnRseSBmcm9tIEMvQysrLCBzbyBjYXJlIGlzIG5lZWRlZCBoZXJlLlxuZnVuY3Rpb24gYm5wSW52RGlnaXQoKSB7XG4gICAgaWYodGhpcy50IDwgMSkgcmV0dXJuIDA7XG4gICAgdmFyIHggPSB0aGlzWzBdO1xuICAgIGlmKCh4JjEpID09IDApIHJldHVybiAwO1xuICAgIHZhciB5ID0geCYzO1x0XHQvLyB5ID09IDEveCBtb2QgMl4yXG4gICAgeSA9ICh5KigyLSh4JjB4ZikqeSkpJjB4ZjtcdC8vIHkgPT0gMS94IG1vZCAyXjRcbiAgICB5ID0gKHkqKDItKHgmMHhmZikqeSkpJjB4ZmY7XHQvLyB5ID09IDEveCBtb2QgMl44XG4gICAgeSA9ICh5KigyLSgoKHgmMHhmZmZmKSp5KSYweGZmZmYpKSkmMHhmZmZmO1x0Ly8geSA9PSAxL3ggbW9kIDJeMTZcbiAgICAvLyBsYXN0IHN0ZXAgLSBjYWxjdWxhdGUgaW52ZXJzZSBtb2QgRFYgZGlyZWN0bHk7XG4gICAgLy8gYXNzdW1lcyAxNiA8IERCIDw9IDMyIGFuZCBhc3N1bWVzIGFiaWxpdHkgdG8gaGFuZGxlIDQ4LWJpdCBpbnRzXG4gICAgeSA9ICh5KigyLXgqeSV0aGlzLkRWKSkldGhpcy5EVjtcdFx0Ly8geSA9PSAxL3ggbW9kIDJeZGJpdHNcbiAgICAvLyB3ZSByZWFsbHkgd2FudCB0aGUgbmVnYXRpdmUgaW52ZXJzZSwgYW5kIC1EViA8IHkgPCBEVlxuICAgIHJldHVybiAoeT4wKT90aGlzLkRWLXk6LXk7XG59XG5cbi8vIE1vbnRnb21lcnkgcmVkdWN0aW9uXG5mdW5jdGlvbiBNb250Z29tZXJ5KG0pIHtcbiAgICB0aGlzLm0gPSBtO1xuICAgIHRoaXMubXAgPSBtLmludkRpZ2l0KCk7XG4gICAgdGhpcy5tcGwgPSB0aGlzLm1wJjB4N2ZmZjtcbiAgICB0aGlzLm1waCA9IHRoaXMubXA+PjE1O1xuICAgIHRoaXMudW0gPSAoMTw8KG0uREItMTUpKS0xO1xuICAgIHRoaXMubXQyID0gMiptLnQ7XG59XG5cbi8vIHhSIG1vZCBtXG5mdW5jdGlvbiBtb250Q29udmVydCh4KSB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB4LmFicygpLmRsU2hpZnRUbyh0aGlzLm0udCxyKTtcbiAgICByLmRpdlJlbVRvKHRoaXMubSxudWxsLHIpO1xuICAgIGlmKHgucyA8IDAgJiYgci5jb21wYXJlVG8oQmlnSW50ZWdlci5aRVJPKSA+IDApIHRoaXMubS5zdWJUbyhyLHIpO1xuICAgIHJldHVybiByO1xufVxuXG4vLyB4L1IgbW9kIG1cbmZ1bmN0aW9uIG1vbnRSZXZlcnQoeCkge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgeC5jb3B5VG8ocik7XG4gICAgdGhpcy5yZWR1Y2Uocik7XG4gICAgcmV0dXJuIHI7XG59XG5cbi8vIHggPSB4L1IgbW9kIG0gKEhBQyAxNC4zMilcbmZ1bmN0aW9uIG1vbnRSZWR1Y2UoeCkge1xuICAgIHdoaWxlKHgudCA8PSB0aGlzLm10MilcdC8vIHBhZCB4IHNvIGFtIGhhcyBlbm91Z2ggcm9vbSBsYXRlclxuICAgICAgICB4W3gudCsrXSA9IDA7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMubS50OyArK2kpIHtcbiAgICAgICAgLy8gZmFzdGVyIHdheSBvZiBjYWxjdWxhdGluZyB1MCA9IHhbaV0qbXAgbW9kIERWXG4gICAgICAgIHZhciBqID0geFtpXSYweDdmZmY7XG4gICAgICAgIHZhciB1MCA9IChqKnRoaXMubXBsKygoKGoqdGhpcy5tcGgrKHhbaV0+PjE1KSp0aGlzLm1wbCkmdGhpcy51bSk8PDE1KSkmeC5ETTtcbiAgICAgICAgLy8gdXNlIGFtIHRvIGNvbWJpbmUgdGhlIG11bHRpcGx5LXNoaWZ0LWFkZCBpbnRvIG9uZSBjYWxsXG4gICAgICAgIGogPSBpK3RoaXMubS50O1xuICAgICAgICB4W2pdICs9IHRoaXMubS5hbSgwLHUwLHgsaSwwLHRoaXMubS50KTtcbiAgICAgICAgLy8gcHJvcGFnYXRlIGNhcnJ5XG4gICAgICAgIHdoaWxlKHhbal0gPj0geC5EVikgeyB4W2pdIC09IHguRFY7IHhbKytqXSsrOyB9XG4gICAgfVxuICAgIHguY2xhbXAoKTtcbiAgICB4LmRyU2hpZnRUbyh0aGlzLm0udCx4KTtcbiAgICBpZih4LmNvbXBhcmVUbyh0aGlzLm0pID49IDApIHguc3ViVG8odGhpcy5tLHgpO1xufVxuXG4vLyByID0gXCJ4XjIvUiBtb2QgbVwiOyB4ICE9IHJcbmZ1bmN0aW9uIG1vbnRTcXJUbyh4LHIpIHsgeC5zcXVhcmVUbyhyKTsgdGhpcy5yZWR1Y2Uocik7IH1cblxuLy8gciA9IFwieHkvUiBtb2QgbVwiOyB4LHkgIT0gclxuZnVuY3Rpb24gbW9udE11bFRvKHgseSxyKSB7IHgubXVsdGlwbHlUbyh5LHIpOyB0aGlzLnJlZHVjZShyKTsgfVxuXG5Nb250Z29tZXJ5LnByb3RvdHlwZS5jb252ZXJ0ID0gbW9udENvbnZlcnQ7XG5Nb250Z29tZXJ5LnByb3RvdHlwZS5yZXZlcnQgPSBtb250UmV2ZXJ0O1xuTW9udGdvbWVyeS5wcm90b3R5cGUucmVkdWNlID0gbW9udFJlZHVjZTtcbk1vbnRnb21lcnkucHJvdG90eXBlLm11bFRvID0gbW9udE11bFRvO1xuTW9udGdvbWVyeS5wcm90b3R5cGUuc3FyVG8gPSBtb250U3FyVG87XG5cbi8vIChwcm90ZWN0ZWQpIHRydWUgaWZmIHRoaXMgaXMgZXZlblxuZnVuY3Rpb24gYm5wSXNFdmVuKCkgeyByZXR1cm4gKCh0aGlzLnQ+MCk/KHRoaXNbMF0mMSk6dGhpcy5zKSA9PSAwOyB9XG5cbi8vIChwcm90ZWN0ZWQpIHRoaXNeZSwgZSA8IDJeMzIsIGRvaW5nIHNxciBhbmQgbXVsIHdpdGggXCJyXCIgKEhBQyAxNC43OSlcbmZ1bmN0aW9uIGJucEV4cChlLHopIHtcbiAgICBpZihlID4gMHhmZmZmZmZmZiB8fCBlIDwgMSkgcmV0dXJuIEJpZ0ludGVnZXIuT05FO1xuICAgIHZhciByID0gbmJpKCksIHIyID0gbmJpKCksIGcgPSB6LmNvbnZlcnQodGhpcyksIGkgPSBuYml0cyhlKS0xO1xuICAgIGcuY29weVRvKHIpO1xuICAgIHdoaWxlKC0taSA+PSAwKSB7XG4gICAgICAgIHouc3FyVG8ocixyMik7XG4gICAgICAgIGlmKChlJigxPDxpKSkgPiAwKSB6Lm11bFRvKHIyLGcscik7XG4gICAgICAgIGVsc2UgeyB2YXIgdCA9IHI7IHIgPSByMjsgcjIgPSB0OyB9XG4gICAgfVxuICAgIHJldHVybiB6LnJldmVydChyKTtcbn1cblxuLy8gKHB1YmxpYykgdGhpc15lICUgbSwgMCA8PSBlIDwgMl4zMlxuZnVuY3Rpb24gYm5Nb2RQb3dJbnQoZSxtKSB7XG4gICAgdmFyIHo7XG4gICAgaWYoZSA8IDI1NiB8fCBtLmlzRXZlbigpKSB6ID0gbmV3IENsYXNzaWMobSk7IGVsc2UgeiA9IG5ldyBNb250Z29tZXJ5KG0pO1xuICAgIHJldHVybiB0aGlzLmV4cChlLHopO1xufVxuXG4vLyBwcm90ZWN0ZWRcbkJpZ0ludGVnZXIucHJvdG90eXBlLmNvcHlUbyA9IGJucENvcHlUbztcbkJpZ0ludGVnZXIucHJvdG90eXBlLmZyb21JbnQgPSBibnBGcm9tSW50O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZnJvbVN0cmluZyA9IGJucEZyb21TdHJpbmc7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5jbGFtcCA9IGJucENsYW1wO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZGxTaGlmdFRvID0gYm5wRExTaGlmdFRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZHJTaGlmdFRvID0gYm5wRFJTaGlmdFRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubFNoaWZ0VG8gPSBibnBMU2hpZnRUbztcbkJpZ0ludGVnZXIucHJvdG90eXBlLnJTaGlmdFRvID0gYm5wUlNoaWZ0VG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5zdWJUbyA9IGJucFN1YlRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubXVsdGlwbHlUbyA9IGJucE11bHRpcGx5VG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5zcXVhcmVUbyA9IGJucFNxdWFyZVRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZGl2UmVtVG8gPSBibnBEaXZSZW1UbztcbkJpZ0ludGVnZXIucHJvdG90eXBlLmludkRpZ2l0ID0gYm5wSW52RGlnaXQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5pc0V2ZW4gPSBibnBJc0V2ZW47XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5leHAgPSBibnBFeHA7XG5cbi8vIHB1YmxpY1xuQmlnSW50ZWdlci5wcm90b3R5cGUudG9TdHJpbmcgPSBiblRvU3RyaW5nO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubmVnYXRlID0gYm5OZWdhdGU7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5hYnMgPSBibkFicztcbkJpZ0ludGVnZXIucHJvdG90eXBlLmNvbXBhcmVUbyA9IGJuQ29tcGFyZVRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuYml0TGVuZ3RoID0gYm5CaXRMZW5ndGg7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5tb2QgPSBibk1vZDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLm1vZFBvd0ludCA9IGJuTW9kUG93SW50O1xuXG4vLyBcImNvbnN0YW50c1wiXG5CaWdJbnRlZ2VyLlpFUk8gPSBuYnYoMCk7XG5CaWdJbnRlZ2VyLk9ORSA9IG5idigxKTtcblxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBqc2JuMi5qcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDUtMjAwOSAgVG9tIFd1XG4vLyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy8gU2VlIFwiTElDRU5TRVwiIGZvciBkZXRhaWxzLlxuXG4vLyBFeHRlbmRlZCBKYXZhU2NyaXB0IEJOIGZ1bmN0aW9ucywgcmVxdWlyZWQgZm9yIFJTQSBwcml2YXRlIG9wcy5cblxuLy8gVmVyc2lvbiAxLjE6IG5ldyBCaWdJbnRlZ2VyKFwiMFwiLCAxMCkgcmV0dXJucyBcInByb3BlclwiIHplcm9cbi8vIFZlcnNpb24gMS4yOiBzcXVhcmUoKSBBUEksIGlzUHJvYmFibGVQcmltZSBmaXhcblxuLy8gKHB1YmxpYylcbmZ1bmN0aW9uIGJuQ2xvbmUoKSB7IHZhciByID0gbmJpKCk7IHRoaXMuY29weVRvKHIpOyByZXR1cm4gcjsgfVxuXG4vLyAocHVibGljKSByZXR1cm4gdmFsdWUgYXMgaW50ZWdlclxuZnVuY3Rpb24gYm5JbnRWYWx1ZSgpIHtcbiAgICBpZih0aGlzLnMgPCAwKSB7XG4gICAgICAgIGlmKHRoaXMudCA9PSAxKSByZXR1cm4gdGhpc1swXS10aGlzLkRWO1xuICAgICAgICBlbHNlIGlmKHRoaXMudCA9PSAwKSByZXR1cm4gLTE7XG4gICAgfVxuICAgIGVsc2UgaWYodGhpcy50ID09IDEpIHJldHVybiB0aGlzWzBdO1xuICAgIGVsc2UgaWYodGhpcy50ID09IDApIHJldHVybiAwO1xuICAgIC8vIGFzc3VtZXMgMTYgPCBEQiA8IDMyXG4gICAgcmV0dXJuICgodGhpc1sxXSYoKDE8PCgzMi10aGlzLkRCKSktMSkpPDx0aGlzLkRCKXx0aGlzWzBdO1xufVxuXG4vLyAocHVibGljKSByZXR1cm4gdmFsdWUgYXMgYnl0ZVxuZnVuY3Rpb24gYm5CeXRlVmFsdWUoKSB7IHJldHVybiAodGhpcy50PT0wKT90aGlzLnM6KHRoaXNbMF08PDI0KT4+MjQ7IH1cblxuLy8gKHB1YmxpYykgcmV0dXJuIHZhbHVlIGFzIHNob3J0IChhc3N1bWVzIERCPj0xNilcbmZ1bmN0aW9uIGJuU2hvcnRWYWx1ZSgpIHsgcmV0dXJuICh0aGlzLnQ9PTApP3RoaXMuczoodGhpc1swXTw8MTYpPj4xNjsgfVxuXG4vLyAocHJvdGVjdGVkKSByZXR1cm4geCBzLnQuIHJeeCA8IERWXG5mdW5jdGlvbiBibnBDaHVua1NpemUocikgeyByZXR1cm4gTWF0aC5mbG9vcihNYXRoLkxOMip0aGlzLkRCL01hdGgubG9nKHIpKTsgfVxuXG4vLyAocHVibGljKSAwIGlmIHRoaXMgPT0gMCwgMSBpZiB0aGlzID4gMFxuZnVuY3Rpb24gYm5TaWdOdW0oKSB7XG4gICAgaWYodGhpcy5zIDwgMCkgcmV0dXJuIC0xO1xuICAgIGVsc2UgaWYodGhpcy50IDw9IDAgfHwgKHRoaXMudCA9PSAxICYmIHRoaXNbMF0gPD0gMCkpIHJldHVybiAwO1xuICAgIGVsc2UgcmV0dXJuIDE7XG59XG5cbi8vIChwcm90ZWN0ZWQpIGNvbnZlcnQgdG8gcmFkaXggc3RyaW5nXG5mdW5jdGlvbiBibnBUb1JhZGl4KGIpIHtcbiAgICBpZihiID09IG51bGwpIGIgPSAxMDtcbiAgICBpZih0aGlzLnNpZ251bSgpID09IDAgfHwgYiA8IDIgfHwgYiA+IDM2KSByZXR1cm4gXCIwXCI7XG4gICAgdmFyIGNzID0gdGhpcy5jaHVua1NpemUoYik7XG4gICAgdmFyIGEgPSBNYXRoLnBvdyhiLGNzKTtcbiAgICB2YXIgZCA9IG5idihhKSwgeSA9IG5iaSgpLCB6ID0gbmJpKCksIHIgPSBcIlwiO1xuICAgIHRoaXMuZGl2UmVtVG8oZCx5LHopO1xuICAgIHdoaWxlKHkuc2lnbnVtKCkgPiAwKSB7XG4gICAgICAgIHIgPSAoYSt6LmludFZhbHVlKCkpLnRvU3RyaW5nKGIpLnN1YnN0cigxKSArIHI7XG4gICAgICAgIHkuZGl2UmVtVG8oZCx5LHopO1xuICAgIH1cbiAgICByZXR1cm4gei5pbnRWYWx1ZSgpLnRvU3RyaW5nKGIpICsgcjtcbn1cblxuLy8gKHByb3RlY3RlZCkgY29udmVydCBmcm9tIHJhZGl4IHN0cmluZ1xuZnVuY3Rpb24gYm5wRnJvbVJhZGl4KHMsYikge1xuICAgIHRoaXMuZnJvbUludCgwKTtcbiAgICBpZihiID09IG51bGwpIGIgPSAxMDtcbiAgICB2YXIgY3MgPSB0aGlzLmNodW5rU2l6ZShiKTtcbiAgICB2YXIgZCA9IE1hdGgucG93KGIsY3MpLCBtaSA9IGZhbHNlLCBqID0gMCwgdyA9IDA7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIHggPSBpbnRBdChzLGkpO1xuICAgICAgICBpZih4IDwgMCkge1xuICAgICAgICAgICAgaWYocy5jaGFyQXQoaSkgPT0gXCItXCIgJiYgdGhpcy5zaWdudW0oKSA9PSAwKSBtaSA9IHRydWU7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB3ID0gYip3K3g7XG4gICAgICAgIGlmKCsraiA+PSBjcykge1xuICAgICAgICAgICAgdGhpcy5kTXVsdGlwbHkoZCk7XG4gICAgICAgICAgICB0aGlzLmRBZGRPZmZzZXQodywwKTtcbiAgICAgICAgICAgIGogPSAwO1xuICAgICAgICAgICAgdyA9IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoaiA+IDApIHtcbiAgICAgICAgdGhpcy5kTXVsdGlwbHkoTWF0aC5wb3coYixqKSk7XG4gICAgICAgIHRoaXMuZEFkZE9mZnNldCh3LDApO1xuICAgIH1cbiAgICBpZihtaSkgQmlnSW50ZWdlci5aRVJPLnN1YlRvKHRoaXMsdGhpcyk7XG59XG5cbi8vIChwcm90ZWN0ZWQpIGFsdGVybmF0ZSBjb25zdHJ1Y3RvclxuZnVuY3Rpb24gYm5wRnJvbU51bWJlcihhLGIsYykge1xuICAgIGlmKFwibnVtYmVyXCIgPT0gdHlwZW9mIGIpIHtcbiAgICAgICAgLy8gbmV3IEJpZ0ludGVnZXIoaW50LGludCxSTkcpXG4gICAgICAgIGlmKGEgPCAyKSB0aGlzLmZyb21JbnQoMSk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5mcm9tTnVtYmVyKGEsYyk7XG4gICAgICAgICAgICBpZighdGhpcy50ZXN0Qml0KGEtMSkpXHQvLyBmb3JjZSBNU0Igc2V0XG4gICAgICAgICAgICAgICAgdGhpcy5iaXR3aXNlVG8oQmlnSW50ZWdlci5PTkUuc2hpZnRMZWZ0KGEtMSksb3Bfb3IsdGhpcyk7XG4gICAgICAgICAgICBpZih0aGlzLmlzRXZlbigpKSB0aGlzLmRBZGRPZmZzZXQoMSwwKTsgLy8gZm9yY2Ugb2RkXG4gICAgICAgICAgICB3aGlsZSghdGhpcy5pc1Byb2JhYmxlUHJpbWUoYikpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRBZGRPZmZzZXQoMiwwKTtcbiAgICAgICAgICAgICAgICBpZih0aGlzLmJpdExlbmd0aCgpID4gYSkgdGhpcy5zdWJUbyhCaWdJbnRlZ2VyLk9ORS5zaGlmdExlZnQoYS0xKSx0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gbmV3IEJpZ0ludGVnZXIoaW50LFJORylcbiAgICAgICAgdmFyIHggPSBuZXcgQXJyYXkoKSwgdCA9IGEmNztcbiAgICAgICAgeC5sZW5ndGggPSAoYT4+MykrMTtcbiAgICAgICAgYi5uZXh0Qnl0ZXMoeCk7XG4gICAgICAgIGlmKHQgPiAwKSB4WzBdICY9ICgoMTw8dCktMSk7IGVsc2UgeFswXSA9IDA7XG4gICAgICAgIHRoaXMuZnJvbVN0cmluZyh4LDI1Nik7XG4gICAgfVxufVxuXG4vLyAocHVibGljKSBjb252ZXJ0IHRvIGJpZ2VuZGlhbiBieXRlIGFycmF5XG5mdW5jdGlvbiBiblRvQnl0ZUFycmF5KCkge1xuICAgIHZhciBpID0gdGhpcy50LCByID0gbmV3IEFycmF5KCk7XG4gICAgclswXSA9IHRoaXMucztcbiAgICB2YXIgcCA9IHRoaXMuREItKGkqdGhpcy5EQiklOCwgZCwgayA9IDA7XG4gICAgaWYoaS0tID4gMCkge1xuICAgICAgICBpZihwIDwgdGhpcy5EQiAmJiAoZCA9IHRoaXNbaV0+PnApICE9ICh0aGlzLnMmdGhpcy5ETSk+PnApXG4gICAgICAgICAgICByW2srK10gPSBkfCh0aGlzLnM8PCh0aGlzLkRCLXApKTtcbiAgICAgICAgd2hpbGUoaSA+PSAwKSB7XG4gICAgICAgICAgICBpZihwIDwgOCkge1xuICAgICAgICAgICAgICAgIGQgPSAodGhpc1tpXSYoKDE8PHApLTEpKTw8KDgtcCk7XG4gICAgICAgICAgICAgICAgZCB8PSB0aGlzWy0taV0+PihwKz10aGlzLkRCLTgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZCA9ICh0aGlzW2ldPj4ocC09OCkpJjB4ZmY7XG4gICAgICAgICAgICAgICAgaWYocCA8PSAwKSB7IHAgKz0gdGhpcy5EQjsgLS1pOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZigoZCYweDgwKSAhPSAwKSBkIHw9IC0yNTY7XG4gICAgICAgICAgICBpZihrID09IDAgJiYgKHRoaXMucyYweDgwKSAhPSAoZCYweDgwKSkgKytrO1xuICAgICAgICAgICAgaWYoayA+IDAgfHwgZCAhPSB0aGlzLnMpIHJbaysrXSA9IGQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHI7XG59XG5cbmZ1bmN0aW9uIGJuRXF1YWxzKGEpIHsgcmV0dXJuKHRoaXMuY29tcGFyZVRvKGEpPT0wKTsgfVxuZnVuY3Rpb24gYm5NaW4oYSkgeyByZXR1cm4odGhpcy5jb21wYXJlVG8oYSk8MCk/dGhpczphOyB9XG5mdW5jdGlvbiBibk1heChhKSB7IHJldHVybih0aGlzLmNvbXBhcmVUbyhhKT4wKT90aGlzOmE7IH1cblxuLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgb3AgYSAoYml0d2lzZSlcbmZ1bmN0aW9uIGJucEJpdHdpc2VUbyhhLG9wLHIpIHtcbiAgICB2YXIgaSwgZiwgbSA9IE1hdGgubWluKGEudCx0aGlzLnQpO1xuICAgIGZvcihpID0gMDsgaSA8IG07ICsraSkgcltpXSA9IG9wKHRoaXNbaV0sYVtpXSk7XG4gICAgaWYoYS50IDwgdGhpcy50KSB7XG4gICAgICAgIGYgPSBhLnMmdGhpcy5ETTtcbiAgICAgICAgZm9yKGkgPSBtOyBpIDwgdGhpcy50OyArK2kpIHJbaV0gPSBvcCh0aGlzW2ldLGYpO1xuICAgICAgICByLnQgPSB0aGlzLnQ7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBmID0gdGhpcy5zJnRoaXMuRE07XG4gICAgICAgIGZvcihpID0gbTsgaSA8IGEudDsgKytpKSByW2ldID0gb3AoZixhW2ldKTtcbiAgICAgICAgci50ID0gYS50O1xuICAgIH1cbiAgICByLnMgPSBvcCh0aGlzLnMsYS5zKTtcbiAgICByLmNsYW1wKCk7XG59XG5cbi8vIChwdWJsaWMpIHRoaXMgJiBhXG5mdW5jdGlvbiBvcF9hbmQoeCx5KSB7IHJldHVybiB4Jnk7IH1cbmZ1bmN0aW9uIGJuQW5kKGEpIHsgdmFyIHIgPSBuYmkoKTsgdGhpcy5iaXR3aXNlVG8oYSxvcF9hbmQscik7IHJldHVybiByOyB9XG5cbi8vIChwdWJsaWMpIHRoaXMgfCBhXG5mdW5jdGlvbiBvcF9vcih4LHkpIHsgcmV0dXJuIHh8eTsgfVxuZnVuY3Rpb24gYm5PcihhKSB7IHZhciByID0gbmJpKCk7IHRoaXMuYml0d2lzZVRvKGEsb3Bfb3Iscik7IHJldHVybiByOyB9XG5cbi8vIChwdWJsaWMpIHRoaXMgXiBhXG5mdW5jdGlvbiBvcF94b3IoeCx5KSB7IHJldHVybiB4Xnk7IH1cbmZ1bmN0aW9uIGJuWG9yKGEpIHsgdmFyIHIgPSBuYmkoKTsgdGhpcy5iaXR3aXNlVG8oYSxvcF94b3Iscik7IHJldHVybiByOyB9XG5cbi8vIChwdWJsaWMpIHRoaXMgJiB+YVxuZnVuY3Rpb24gb3BfYW5kbm90KHgseSkgeyByZXR1cm4geCZ+eTsgfVxuZnVuY3Rpb24gYm5BbmROb3QoYSkgeyB2YXIgciA9IG5iaSgpOyB0aGlzLmJpdHdpc2VUbyhhLG9wX2FuZG5vdCxyKTsgcmV0dXJuIHI7IH1cblxuLy8gKHB1YmxpYykgfnRoaXNcbmZ1bmN0aW9uIGJuTm90KCkge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMudDsgKytpKSByW2ldID0gdGhpcy5ETSZ+dGhpc1tpXTtcbiAgICByLnQgPSB0aGlzLnQ7XG4gICAgci5zID0gfnRoaXMucztcbiAgICByZXR1cm4gcjtcbn1cblxuLy8gKHB1YmxpYykgdGhpcyA8PCBuXG5mdW5jdGlvbiBiblNoaWZ0TGVmdChuKSB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICBpZihuIDwgMCkgdGhpcy5yU2hpZnRUbygtbixyKTsgZWxzZSB0aGlzLmxTaGlmdFRvKG4scik7XG4gICAgcmV0dXJuIHI7XG59XG5cbi8vIChwdWJsaWMpIHRoaXMgPj4gblxuZnVuY3Rpb24gYm5TaGlmdFJpZ2h0KG4pIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIGlmKG4gPCAwKSB0aGlzLmxTaGlmdFRvKC1uLHIpOyBlbHNlIHRoaXMuclNoaWZ0VG8obixyKTtcbiAgICByZXR1cm4gcjtcbn1cblxuLy8gcmV0dXJuIGluZGV4IG9mIGxvd2VzdCAxLWJpdCBpbiB4LCB4IDwgMl4zMVxuZnVuY3Rpb24gbGJpdCh4KSB7XG4gICAgaWYoeCA9PSAwKSByZXR1cm4gLTE7XG4gICAgdmFyIHIgPSAwO1xuICAgIGlmKCh4JjB4ZmZmZikgPT0gMCkgeyB4ID4+PSAxNjsgciArPSAxNjsgfVxuICAgIGlmKCh4JjB4ZmYpID09IDApIHsgeCA+Pj0gODsgciArPSA4OyB9XG4gICAgaWYoKHgmMHhmKSA9PSAwKSB7IHggPj49IDQ7IHIgKz0gNDsgfVxuICAgIGlmKCh4JjMpID09IDApIHsgeCA+Pj0gMjsgciArPSAyOyB9XG4gICAgaWYoKHgmMSkgPT0gMCkgKytyO1xuICAgIHJldHVybiByO1xufVxuXG4vLyAocHVibGljKSByZXR1cm5zIGluZGV4IG9mIGxvd2VzdCAxLWJpdCAob3IgLTEgaWYgbm9uZSlcbmZ1bmN0aW9uIGJuR2V0TG93ZXN0U2V0Qml0KCkge1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLnQ7ICsraSlcbiAgICAgICAgaWYodGhpc1tpXSAhPSAwKSByZXR1cm4gaSp0aGlzLkRCK2xiaXQodGhpc1tpXSk7XG4gICAgaWYodGhpcy5zIDwgMCkgcmV0dXJuIHRoaXMudCp0aGlzLkRCO1xuICAgIHJldHVybiAtMTtcbn1cblxuLy8gcmV0dXJuIG51bWJlciBvZiAxIGJpdHMgaW4geFxuZnVuY3Rpb24gY2JpdCh4KSB7XG4gICAgdmFyIHIgPSAwO1xuICAgIHdoaWxlKHggIT0gMCkgeyB4ICY9IHgtMTsgKytyOyB9XG4gICAgcmV0dXJuIHI7XG59XG5cbi8vIChwdWJsaWMpIHJldHVybiBudW1iZXIgb2Ygc2V0IGJpdHNcbmZ1bmN0aW9uIGJuQml0Q291bnQoKSB7XG4gICAgdmFyIHIgPSAwLCB4ID0gdGhpcy5zJnRoaXMuRE07XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMudDsgKytpKSByICs9IGNiaXQodGhpc1tpXV54KTtcbiAgICByZXR1cm4gcjtcbn1cblxuLy8gKHB1YmxpYykgdHJ1ZSBpZmYgbnRoIGJpdCBpcyBzZXRcbmZ1bmN0aW9uIGJuVGVzdEJpdChuKSB7XG4gICAgdmFyIGogPSBNYXRoLmZsb29yKG4vdGhpcy5EQik7XG4gICAgaWYoaiA+PSB0aGlzLnQpIHJldHVybih0aGlzLnMhPTApO1xuICAgIHJldHVybigodGhpc1tqXSYoMTw8KG4ldGhpcy5EQikpKSE9MCk7XG59XG5cbi8vIChwcm90ZWN0ZWQpIHRoaXMgb3AgKDE8PG4pXG5mdW5jdGlvbiBibnBDaGFuZ2VCaXQobixvcCkge1xuICAgIHZhciByID0gQmlnSW50ZWdlci5PTkUuc2hpZnRMZWZ0KG4pO1xuICAgIHRoaXMuYml0d2lzZVRvKHIsb3Ascik7XG4gICAgcmV0dXJuIHI7XG59XG5cbi8vIChwdWJsaWMpIHRoaXMgfCAoMTw8bilcbmZ1bmN0aW9uIGJuU2V0Qml0KG4pIHsgcmV0dXJuIHRoaXMuY2hhbmdlQml0KG4sb3Bfb3IpOyB9XG5cbi8vIChwdWJsaWMpIHRoaXMgJiB+KDE8PG4pXG5mdW5jdGlvbiBibkNsZWFyQml0KG4pIHsgcmV0dXJuIHRoaXMuY2hhbmdlQml0KG4sb3BfYW5kbm90KTsgfVxuXG4vLyAocHVibGljKSB0aGlzIF4gKDE8PG4pXG5mdW5jdGlvbiBibkZsaXBCaXQobikgeyByZXR1cm4gdGhpcy5jaGFuZ2VCaXQobixvcF94b3IpOyB9XG5cbi8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzICsgYVxuZnVuY3Rpb24gYm5wQWRkVG8oYSxyKSB7XG4gICAgdmFyIGkgPSAwLCBjID0gMCwgbSA9IE1hdGgubWluKGEudCx0aGlzLnQpO1xuICAgIHdoaWxlKGkgPCBtKSB7XG4gICAgICAgIGMgKz0gdGhpc1tpXSthW2ldO1xuICAgICAgICByW2krK10gPSBjJnRoaXMuRE07XG4gICAgICAgIGMgPj49IHRoaXMuREI7XG4gICAgfVxuICAgIGlmKGEudCA8IHRoaXMudCkge1xuICAgICAgICBjICs9IGEucztcbiAgICAgICAgd2hpbGUoaSA8IHRoaXMudCkge1xuICAgICAgICAgICAgYyArPSB0aGlzW2ldO1xuICAgICAgICAgICAgcltpKytdID0gYyZ0aGlzLkRNO1xuICAgICAgICAgICAgYyA+Pj0gdGhpcy5EQjtcbiAgICAgICAgfVxuICAgICAgICBjICs9IHRoaXMucztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGMgKz0gdGhpcy5zO1xuICAgICAgICB3aGlsZShpIDwgYS50KSB7XG4gICAgICAgICAgICBjICs9IGFbaV07XG4gICAgICAgICAgICByW2krK10gPSBjJnRoaXMuRE07XG4gICAgICAgICAgICBjID4+PSB0aGlzLkRCO1xuICAgICAgICB9XG4gICAgICAgIGMgKz0gYS5zO1xuICAgIH1cbiAgICByLnMgPSAoYzwwKT8tMTowO1xuICAgIGlmKGMgPiAwKSByW2krK10gPSBjO1xuICAgIGVsc2UgaWYoYyA8IC0xKSByW2krK10gPSB0aGlzLkRWK2M7XG4gICAgci50ID0gaTtcbiAgICByLmNsYW1wKCk7XG59XG5cbi8vIChwdWJsaWMpIHRoaXMgKyBhXG5mdW5jdGlvbiBibkFkZChhKSB7IHZhciByID0gbmJpKCk7IHRoaXMuYWRkVG8oYSxyKTsgcmV0dXJuIHI7IH1cblxuLy8gKHB1YmxpYykgdGhpcyAtIGFcbmZ1bmN0aW9uIGJuU3VidHJhY3QoYSkgeyB2YXIgciA9IG5iaSgpOyB0aGlzLnN1YlRvKGEscik7IHJldHVybiByOyB9XG5cbi8vIChwdWJsaWMpIHRoaXMgKiBhXG5mdW5jdGlvbiBibk11bHRpcGx5KGEpIHsgdmFyIHIgPSBuYmkoKTsgdGhpcy5tdWx0aXBseVRvKGEscik7IHJldHVybiByOyB9XG5cbi8vIChwdWJsaWMpIHRoaXNeMlxuZnVuY3Rpb24gYm5TcXVhcmUoKSB7IHZhciByID0gbmJpKCk7IHRoaXMuc3F1YXJlVG8ocik7IHJldHVybiByOyB9XG5cbi8vIChwdWJsaWMpIHRoaXMgLyBhXG5mdW5jdGlvbiBibkRpdmlkZShhKSB7IHZhciByID0gbmJpKCk7IHRoaXMuZGl2UmVtVG8oYSxyLG51bGwpOyByZXR1cm4gcjsgfVxuXG4vLyAocHVibGljKSB0aGlzICUgYVxuZnVuY3Rpb24gYm5SZW1haW5kZXIoYSkgeyB2YXIgciA9IG5iaSgpOyB0aGlzLmRpdlJlbVRvKGEsbnVsbCxyKTsgcmV0dXJuIHI7IH1cblxuLy8gKHB1YmxpYykgW3RoaXMvYSx0aGlzJWFdXG5mdW5jdGlvbiBibkRpdmlkZUFuZFJlbWFpbmRlcihhKSB7XG4gICAgdmFyIHEgPSBuYmkoKSwgciA9IG5iaSgpO1xuICAgIHRoaXMuZGl2UmVtVG8oYSxxLHIpO1xuICAgIHJldHVybiBuZXcgQXJyYXkocSxyKTtcbn1cblxuLy8gKHByb3RlY3RlZCkgdGhpcyAqPSBuLCB0aGlzID49IDAsIDEgPCBuIDwgRFZcbmZ1bmN0aW9uIGJucERNdWx0aXBseShuKSB7XG4gICAgdGhpc1t0aGlzLnRdID0gdGhpcy5hbSgwLG4tMSx0aGlzLDAsMCx0aGlzLnQpO1xuICAgICsrdGhpcy50O1xuICAgIHRoaXMuY2xhbXAoKTtcbn1cblxuLy8gKHByb3RlY3RlZCkgdGhpcyArPSBuIDw8IHcgd29yZHMsIHRoaXMgPj0gMFxuZnVuY3Rpb24gYm5wREFkZE9mZnNldChuLHcpIHtcbiAgICBpZihuID09IDApIHJldHVybjtcbiAgICB3aGlsZSh0aGlzLnQgPD0gdykgdGhpc1t0aGlzLnQrK10gPSAwO1xuICAgIHRoaXNbd10gKz0gbjtcbiAgICB3aGlsZSh0aGlzW3ddID49IHRoaXMuRFYpIHtcbiAgICAgICAgdGhpc1t3XSAtPSB0aGlzLkRWO1xuICAgICAgICBpZigrK3cgPj0gdGhpcy50KSB0aGlzW3RoaXMudCsrXSA9IDA7XG4gICAgICAgICsrdGhpc1t3XTtcbiAgICB9XG59XG5cbi8vIEEgXCJudWxsXCIgcmVkdWNlclxuZnVuY3Rpb24gTnVsbEV4cCgpIHt9XG5mdW5jdGlvbiBuTm9wKHgpIHsgcmV0dXJuIHg7IH1cbmZ1bmN0aW9uIG5NdWxUbyh4LHkscikgeyB4Lm11bHRpcGx5VG8oeSxyKTsgfVxuZnVuY3Rpb24gblNxclRvKHgscikgeyB4LnNxdWFyZVRvKHIpOyB9XG5cbk51bGxFeHAucHJvdG90eXBlLmNvbnZlcnQgPSBuTm9wO1xuTnVsbEV4cC5wcm90b3R5cGUucmV2ZXJ0ID0gbk5vcDtcbk51bGxFeHAucHJvdG90eXBlLm11bFRvID0gbk11bFRvO1xuTnVsbEV4cC5wcm90b3R5cGUuc3FyVG8gPSBuU3FyVG87XG5cbi8vIChwdWJsaWMpIHRoaXNeZVxuZnVuY3Rpb24gYm5Qb3coZSkgeyByZXR1cm4gdGhpcy5leHAoZSxuZXcgTnVsbEV4cCgpKTsgfVxuXG4vLyAocHJvdGVjdGVkKSByID0gbG93ZXIgbiB3b3JkcyBvZiBcInRoaXMgKiBhXCIsIGEudCA8PSBuXG4vLyBcInRoaXNcIiBzaG91bGQgYmUgdGhlIGxhcmdlciBvbmUgaWYgYXBwcm9wcmlhdGUuXG5mdW5jdGlvbiBibnBNdWx0aXBseUxvd2VyVG8oYSxuLHIpIHtcbiAgICB2YXIgaSA9IE1hdGgubWluKHRoaXMudCthLnQsbik7XG4gICAgci5zID0gMDsgLy8gYXNzdW1lcyBhLHRoaXMgPj0gMFxuICAgIHIudCA9IGk7XG4gICAgd2hpbGUoaSA+IDApIHJbLS1pXSA9IDA7XG4gICAgdmFyIGo7XG4gICAgZm9yKGogPSByLnQtdGhpcy50OyBpIDwgajsgKytpKSByW2krdGhpcy50XSA9IHRoaXMuYW0oMCxhW2ldLHIsaSwwLHRoaXMudCk7XG4gICAgZm9yKGogPSBNYXRoLm1pbihhLnQsbik7IGkgPCBqOyArK2kpIHRoaXMuYW0oMCxhW2ldLHIsaSwwLG4taSk7XG4gICAgci5jbGFtcCgpO1xufVxuXG4vLyAocHJvdGVjdGVkKSByID0gXCJ0aGlzICogYVwiIHdpdGhvdXQgbG93ZXIgbiB3b3JkcywgbiA+IDBcbi8vIFwidGhpc1wiIHNob3VsZCBiZSB0aGUgbGFyZ2VyIG9uZSBpZiBhcHByb3ByaWF0ZS5cbmZ1bmN0aW9uIGJucE11bHRpcGx5VXBwZXJUbyhhLG4scikge1xuICAgIC0tbjtcbiAgICB2YXIgaSA9IHIudCA9IHRoaXMudCthLnQtbjtcbiAgICByLnMgPSAwOyAvLyBhc3N1bWVzIGEsdGhpcyA+PSAwXG4gICAgd2hpbGUoLS1pID49IDApIHJbaV0gPSAwO1xuICAgIGZvcihpID0gTWF0aC5tYXgobi10aGlzLnQsMCk7IGkgPCBhLnQ7ICsraSlcbiAgICAgICAgclt0aGlzLnQraS1uXSA9IHRoaXMuYW0obi1pLGFbaV0sciwwLDAsdGhpcy50K2ktbik7XG4gICAgci5jbGFtcCgpO1xuICAgIHIuZHJTaGlmdFRvKDEscik7XG59XG5cbi8vIEJhcnJldHQgbW9kdWxhciByZWR1Y3Rpb25cbmZ1bmN0aW9uIEJhcnJldHQobSkge1xuICAgIC8vIHNldHVwIEJhcnJldHRcbiAgICB0aGlzLnIyID0gbmJpKCk7XG4gICAgdGhpcy5xMyA9IG5iaSgpO1xuICAgIEJpZ0ludGVnZXIuT05FLmRsU2hpZnRUbygyKm0udCx0aGlzLnIyKTtcbiAgICB0aGlzLm11ID0gdGhpcy5yMi5kaXZpZGUobSk7XG4gICAgdGhpcy5tID0gbTtcbn1cblxuZnVuY3Rpb24gYmFycmV0dENvbnZlcnQoeCkge1xuICAgIGlmKHgucyA8IDAgfHwgeC50ID4gMip0aGlzLm0udCkgcmV0dXJuIHgubW9kKHRoaXMubSk7XG4gICAgZWxzZSBpZih4LmNvbXBhcmVUbyh0aGlzLm0pIDwgMCkgcmV0dXJuIHg7XG4gICAgZWxzZSB7IHZhciByID0gbmJpKCk7IHguY29weVRvKHIpOyB0aGlzLnJlZHVjZShyKTsgcmV0dXJuIHI7IH1cbn1cblxuZnVuY3Rpb24gYmFycmV0dFJldmVydCh4KSB7IHJldHVybiB4OyB9XG5cbi8vIHggPSB4IG1vZCBtIChIQUMgMTQuNDIpXG5mdW5jdGlvbiBiYXJyZXR0UmVkdWNlKHgpIHtcbiAgICB4LmRyU2hpZnRUbyh0aGlzLm0udC0xLHRoaXMucjIpO1xuICAgIGlmKHgudCA+IHRoaXMubS50KzEpIHsgeC50ID0gdGhpcy5tLnQrMTsgeC5jbGFtcCgpOyB9XG4gICAgdGhpcy5tdS5tdWx0aXBseVVwcGVyVG8odGhpcy5yMix0aGlzLm0udCsxLHRoaXMucTMpO1xuICAgIHRoaXMubS5tdWx0aXBseUxvd2VyVG8odGhpcy5xMyx0aGlzLm0udCsxLHRoaXMucjIpO1xuICAgIHdoaWxlKHguY29tcGFyZVRvKHRoaXMucjIpIDwgMCkgeC5kQWRkT2Zmc2V0KDEsdGhpcy5tLnQrMSk7XG4gICAgeC5zdWJUbyh0aGlzLnIyLHgpO1xuICAgIHdoaWxlKHguY29tcGFyZVRvKHRoaXMubSkgPj0gMCkgeC5zdWJUbyh0aGlzLm0seCk7XG59XG5cbi8vIHIgPSB4XjIgbW9kIG07IHggIT0gclxuZnVuY3Rpb24gYmFycmV0dFNxclRvKHgscikgeyB4LnNxdWFyZVRvKHIpOyB0aGlzLnJlZHVjZShyKTsgfVxuXG4vLyByID0geCp5IG1vZCBtOyB4LHkgIT0gclxuZnVuY3Rpb24gYmFycmV0dE11bFRvKHgseSxyKSB7IHgubXVsdGlwbHlUbyh5LHIpOyB0aGlzLnJlZHVjZShyKTsgfVxuXG5CYXJyZXR0LnByb3RvdHlwZS5jb252ZXJ0ID0gYmFycmV0dENvbnZlcnQ7XG5CYXJyZXR0LnByb3RvdHlwZS5yZXZlcnQgPSBiYXJyZXR0UmV2ZXJ0O1xuQmFycmV0dC5wcm90b3R5cGUucmVkdWNlID0gYmFycmV0dFJlZHVjZTtcbkJhcnJldHQucHJvdG90eXBlLm11bFRvID0gYmFycmV0dE11bFRvO1xuQmFycmV0dC5wcm90b3R5cGUuc3FyVG8gPSBiYXJyZXR0U3FyVG87XG5cbi8vIChwdWJsaWMpIHRoaXNeZSAlIG0gKEhBQyAxNC44NSlcbmZ1bmN0aW9uIGJuTW9kUG93KGUsbSkge1xuICAgIHZhciBpID0gZS5iaXRMZW5ndGgoKSwgaywgciA9IG5idigxKSwgejtcbiAgICBpZihpIDw9IDApIHJldHVybiByO1xuICAgIGVsc2UgaWYoaSA8IDE4KSBrID0gMTtcbiAgICBlbHNlIGlmKGkgPCA0OCkgayA9IDM7XG4gICAgZWxzZSBpZihpIDwgMTQ0KSBrID0gNDtcbiAgICBlbHNlIGlmKGkgPCA3NjgpIGsgPSA1O1xuICAgIGVsc2UgayA9IDY7XG4gICAgaWYoaSA8IDgpXG4gICAgICAgIHogPSBuZXcgQ2xhc3NpYyhtKTtcbiAgICBlbHNlIGlmKG0uaXNFdmVuKCkpXG4gICAgICAgIHogPSBuZXcgQmFycmV0dChtKTtcbiAgICBlbHNlXG4gICAgICAgIHogPSBuZXcgTW9udGdvbWVyeShtKTtcblxuICAgIC8vIHByZWNvbXB1dGF0aW9uXG4gICAgdmFyIGcgPSBuZXcgQXJyYXkoKSwgbiA9IDMsIGsxID0gay0xLCBrbSA9ICgxPDxrKS0xO1xuICAgIGdbMV0gPSB6LmNvbnZlcnQodGhpcyk7XG4gICAgaWYoayA+IDEpIHtcbiAgICAgICAgdmFyIGcyID0gbmJpKCk7XG4gICAgICAgIHouc3FyVG8oZ1sxXSxnMik7XG4gICAgICAgIHdoaWxlKG4gPD0ga20pIHtcbiAgICAgICAgICAgIGdbbl0gPSBuYmkoKTtcbiAgICAgICAgICAgIHoubXVsVG8oZzIsZ1tuLTJdLGdbbl0pO1xuICAgICAgICAgICAgbiArPSAyO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGogPSBlLnQtMSwgdywgaXMxID0gdHJ1ZSwgcjIgPSBuYmkoKSwgdDtcbiAgICBpID0gbmJpdHMoZVtqXSktMTtcbiAgICB3aGlsZShqID49IDApIHtcbiAgICAgICAgaWYoaSA+PSBrMSkgdyA9IChlW2pdPj4oaS1rMSkpJmttO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHcgPSAoZVtqXSYoKDE8PChpKzEpKS0xKSk8PChrMS1pKTtcbiAgICAgICAgICAgIGlmKGogPiAwKSB3IHw9IGVbai0xXT4+KHRoaXMuREIraS1rMSk7XG4gICAgICAgIH1cblxuICAgICAgICBuID0gaztcbiAgICAgICAgd2hpbGUoKHcmMSkgPT0gMCkgeyB3ID4+PSAxOyAtLW47IH1cbiAgICAgICAgaWYoKGkgLT0gbikgPCAwKSB7IGkgKz0gdGhpcy5EQjsgLS1qOyB9XG4gICAgICAgIGlmKGlzMSkge1x0Ly8gcmV0ID09IDEsIGRvbid0IGJvdGhlciBzcXVhcmluZyBvciBtdWx0aXBseWluZyBpdFxuICAgICAgICAgICAgZ1t3XS5jb3B5VG8ocik7XG4gICAgICAgICAgICBpczEgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHdoaWxlKG4gPiAxKSB7IHouc3FyVG8ocixyMik7IHouc3FyVG8ocjIscik7IG4gLT0gMjsgfVxuICAgICAgICAgICAgaWYobiA+IDApIHouc3FyVG8ocixyMik7IGVsc2UgeyB0ID0gcjsgciA9IHIyOyByMiA9IHQ7IH1cbiAgICAgICAgICAgIHoubXVsVG8ocjIsZ1t3XSxyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlKGogPj0gMCAmJiAoZVtqXSYoMTw8aSkpID09IDApIHtcbiAgICAgICAgICAgIHouc3FyVG8ocixyMik7IHQgPSByOyByID0gcjI7IHIyID0gdDtcbiAgICAgICAgICAgIGlmKC0taSA8IDApIHsgaSA9IHRoaXMuREItMTsgLS1qOyB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHoucmV2ZXJ0KHIpO1xufVxuXG4vLyAocHVibGljKSBnY2QodGhpcyxhKSAoSEFDIDE0LjU0KVxuZnVuY3Rpb24gYm5HQ0QoYSkge1xuICAgIHZhciB4ID0gKHRoaXMuczwwKT90aGlzLm5lZ2F0ZSgpOnRoaXMuY2xvbmUoKTtcbiAgICB2YXIgeSA9IChhLnM8MCk/YS5uZWdhdGUoKTphLmNsb25lKCk7XG4gICAgaWYoeC5jb21wYXJlVG8oeSkgPCAwKSB7IHZhciB0ID0geDsgeCA9IHk7IHkgPSB0OyB9XG4gICAgdmFyIGkgPSB4LmdldExvd2VzdFNldEJpdCgpLCBnID0geS5nZXRMb3dlc3RTZXRCaXQoKTtcbiAgICBpZihnIDwgMCkgcmV0dXJuIHg7XG4gICAgaWYoaSA8IGcpIGcgPSBpO1xuICAgIGlmKGcgPiAwKSB7XG4gICAgICAgIHguclNoaWZ0VG8oZyx4KTtcbiAgICAgICAgeS5yU2hpZnRUbyhnLHkpO1xuICAgIH1cbiAgICB3aGlsZSh4LnNpZ251bSgpID4gMCkge1xuICAgICAgICBpZigoaSA9IHguZ2V0TG93ZXN0U2V0Qml0KCkpID4gMCkgeC5yU2hpZnRUbyhpLHgpO1xuICAgICAgICBpZigoaSA9IHkuZ2V0TG93ZXN0U2V0Qml0KCkpID4gMCkgeS5yU2hpZnRUbyhpLHkpO1xuICAgICAgICBpZih4LmNvbXBhcmVUbyh5KSA+PSAwKSB7XG4gICAgICAgICAgICB4LnN1YlRvKHkseCk7XG4gICAgICAgICAgICB4LnJTaGlmdFRvKDEseCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB5LnN1YlRvKHgseSk7XG4gICAgICAgICAgICB5LnJTaGlmdFRvKDEseSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoZyA+IDApIHkubFNoaWZ0VG8oZyx5KTtcbiAgICByZXR1cm4geTtcbn1cblxuLy8gKHByb3RlY3RlZCkgdGhpcyAlIG4sIG4gPCAyXjI2XG5mdW5jdGlvbiBibnBNb2RJbnQobikge1xuICAgIGlmKG4gPD0gMCkgcmV0dXJuIDA7XG4gICAgdmFyIGQgPSB0aGlzLkRWJW4sIHIgPSAodGhpcy5zPDApP24tMTowO1xuICAgIGlmKHRoaXMudCA+IDApXG4gICAgICAgIGlmKGQgPT0gMCkgciA9IHRoaXNbMF0lbjtcbiAgICAgICAgZWxzZSBmb3IodmFyIGkgPSB0aGlzLnQtMTsgaSA+PSAwOyAtLWkpIHIgPSAoZCpyK3RoaXNbaV0pJW47XG4gICAgcmV0dXJuIHI7XG59XG5cbi8vIChwdWJsaWMpIDEvdGhpcyAlIG0gKEhBQyAxNC42MSlcbmZ1bmN0aW9uIGJuTW9kSW52ZXJzZShtKSB7XG4gICAgdmFyIGFjID0gbS5pc0V2ZW4oKTtcbiAgICBpZigodGhpcy5pc0V2ZW4oKSAmJiBhYykgfHwgbS5zaWdudW0oKSA9PSAwKSByZXR1cm4gQmlnSW50ZWdlci5aRVJPO1xuICAgIHZhciB1ID0gbS5jbG9uZSgpLCB2ID0gdGhpcy5jbG9uZSgpO1xuICAgIHZhciBhID0gbmJ2KDEpLCBiID0gbmJ2KDApLCBjID0gbmJ2KDApLCBkID0gbmJ2KDEpO1xuICAgIHdoaWxlKHUuc2lnbnVtKCkgIT0gMCkge1xuICAgICAgICB3aGlsZSh1LmlzRXZlbigpKSB7XG4gICAgICAgICAgICB1LnJTaGlmdFRvKDEsdSk7XG4gICAgICAgICAgICBpZihhYykge1xuICAgICAgICAgICAgICAgIGlmKCFhLmlzRXZlbigpIHx8ICFiLmlzRXZlbigpKSB7IGEuYWRkVG8odGhpcyxhKTsgYi5zdWJUbyhtLGIpOyB9XG4gICAgICAgICAgICAgICAgYS5yU2hpZnRUbygxLGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZighYi5pc0V2ZW4oKSkgYi5zdWJUbyhtLGIpO1xuICAgICAgICAgICAgYi5yU2hpZnRUbygxLGIpO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlKHYuaXNFdmVuKCkpIHtcbiAgICAgICAgICAgIHYuclNoaWZ0VG8oMSx2KTtcbiAgICAgICAgICAgIGlmKGFjKSB7XG4gICAgICAgICAgICAgICAgaWYoIWMuaXNFdmVuKCkgfHwgIWQuaXNFdmVuKCkpIHsgYy5hZGRUbyh0aGlzLGMpOyBkLnN1YlRvKG0sZCk7IH1cbiAgICAgICAgICAgICAgICBjLnJTaGlmdFRvKDEsYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKCFkLmlzRXZlbigpKSBkLnN1YlRvKG0sZCk7XG4gICAgICAgICAgICBkLnJTaGlmdFRvKDEsZCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYodS5jb21wYXJlVG8odikgPj0gMCkge1xuICAgICAgICAgICAgdS5zdWJUbyh2LHUpO1xuICAgICAgICAgICAgaWYoYWMpIGEuc3ViVG8oYyxhKTtcbiAgICAgICAgICAgIGIuc3ViVG8oZCxiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHYuc3ViVG8odSx2KTtcbiAgICAgICAgICAgIGlmKGFjKSBjLnN1YlRvKGEsYyk7XG4gICAgICAgICAgICBkLnN1YlRvKGIsZCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYodi5jb21wYXJlVG8oQmlnSW50ZWdlci5PTkUpICE9IDApIHJldHVybiBCaWdJbnRlZ2VyLlpFUk87XG4gICAgaWYoZC5jb21wYXJlVG8obSkgPj0gMCkgcmV0dXJuIGQuc3VidHJhY3QobSk7XG4gICAgaWYoZC5zaWdudW0oKSA8IDApIGQuYWRkVG8obSxkKTsgZWxzZSByZXR1cm4gZDtcbiAgICBpZihkLnNpZ251bSgpIDwgMCkgcmV0dXJuIGQuYWRkKG0pOyBlbHNlIHJldHVybiBkO1xufVxuXG52YXIgbG93cHJpbWVzID0gWzIsMyw1LDcsMTEsMTMsMTcsMTksMjMsMjksMzEsMzcsNDEsNDMsNDcsNTMsNTksNjEsNjcsNzEsNzMsNzksODMsODksOTcsMTAxLDEwMywxMDcsMTA5LDExMywxMjcsMTMxLDEzNywxMzksMTQ5LDE1MSwxNTcsMTYzLDE2NywxNzMsMTc5LDE4MSwxOTEsMTkzLDE5NywxOTksMjExLDIyMywyMjcsMjI5LDIzMywyMzksMjQxLDI1MSwyNTcsMjYzLDI2OSwyNzEsMjc3LDI4MSwyODMsMjkzLDMwNywzMTEsMzEzLDMxNywzMzEsMzM3LDM0NywzNDksMzUzLDM1OSwzNjcsMzczLDM3OSwzODMsMzg5LDM5Nyw0MDEsNDA5LDQxOSw0MjEsNDMxLDQzMyw0MzksNDQzLDQ0OSw0NTcsNDYxLDQ2Myw0NjcsNDc5LDQ4Nyw0OTEsNDk5LDUwMyw1MDksNTIxLDUyMyw1NDEsNTQ3LDU1Nyw1NjMsNTY5LDU3MSw1NzcsNTg3LDU5Myw1OTksNjAxLDYwNyw2MTMsNjE3LDYxOSw2MzEsNjQxLDY0Myw2NDcsNjUzLDY1OSw2NjEsNjczLDY3Nyw2ODMsNjkxLDcwMSw3MDksNzE5LDcyNyw3MzMsNzM5LDc0Myw3NTEsNzU3LDc2MSw3NjksNzczLDc4Nyw3OTcsODA5LDgxMSw4MjEsODIzLDgyNyw4MjksODM5LDg1Myw4NTcsODU5LDg2Myw4NzcsODgxLDg4Myw4ODcsOTA3LDkxMSw5MTksOTI5LDkzNyw5NDEsOTQ3LDk1Myw5NjcsOTcxLDk3Nyw5ODMsOTkxLDk5N107XG52YXIgbHBsaW0gPSAoMTw8MjYpL2xvd3ByaW1lc1tsb3dwcmltZXMubGVuZ3RoLTFdO1xuXG4vLyAocHVibGljKSB0ZXN0IHByaW1hbGl0eSB3aXRoIGNlcnRhaW50eSA+PSAxLS41XnRcbmZ1bmN0aW9uIGJuSXNQcm9iYWJsZVByaW1lKHQpIHtcbiAgICB2YXIgaSwgeCA9IHRoaXMuYWJzKCk7XG4gICAgaWYoeC50ID09IDEgJiYgeFswXSA8PSBsb3dwcmltZXNbbG93cHJpbWVzLmxlbmd0aC0xXSkge1xuICAgICAgICBmb3IoaSA9IDA7IGkgPCBsb3dwcmltZXMubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICBpZih4WzBdID09IGxvd3ByaW1lc1tpXSkgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYoeC5pc0V2ZW4oKSkgcmV0dXJuIGZhbHNlO1xuICAgIGkgPSAxO1xuICAgIHdoaWxlKGkgPCBsb3dwcmltZXMubGVuZ3RoKSB7XG4gICAgICAgIHZhciBtID0gbG93cHJpbWVzW2ldLCBqID0gaSsxO1xuICAgICAgICB3aGlsZShqIDwgbG93cHJpbWVzLmxlbmd0aCAmJiBtIDwgbHBsaW0pIG0gKj0gbG93cHJpbWVzW2orK107XG4gICAgICAgIG0gPSB4Lm1vZEludChtKTtcbiAgICAgICAgd2hpbGUoaSA8IGopIGlmKG0lbG93cHJpbWVzW2krK10gPT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4geC5taWxsZXJSYWJpbih0KTtcbn1cblxuLy8gKHByb3RlY3RlZCkgdHJ1ZSBpZiBwcm9iYWJseSBwcmltZSAoSEFDIDQuMjQsIE1pbGxlci1SYWJpbilcbmZ1bmN0aW9uIGJucE1pbGxlclJhYmluKHQpIHtcbiAgICB2YXIgbjEgPSB0aGlzLnN1YnRyYWN0KEJpZ0ludGVnZXIuT05FKTtcbiAgICB2YXIgayA9IG4xLmdldExvd2VzdFNldEJpdCgpO1xuICAgIGlmKGsgPD0gMCkgcmV0dXJuIGZhbHNlO1xuICAgIHZhciByID0gbjEuc2hpZnRSaWdodChrKTtcbiAgICB0ID0gKHQrMSk+PjE7XG4gICAgaWYodCA+IGxvd3ByaW1lcy5sZW5ndGgpIHQgPSBsb3dwcmltZXMubGVuZ3RoO1xuICAgIHZhciBhID0gbmJpKCk7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHQ7ICsraSkge1xuICAgICAgICAvL1BpY2sgYmFzZXMgYXQgcmFuZG9tLCBpbnN0ZWFkIG9mIHN0YXJ0aW5nIGF0IDJcbiAgICAgICAgYS5mcm9tSW50KGxvd3ByaW1lc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqbG93cHJpbWVzLmxlbmd0aCldKTtcbiAgICAgICAgdmFyIHkgPSBhLm1vZFBvdyhyLHRoaXMpO1xuICAgICAgICBpZih5LmNvbXBhcmVUbyhCaWdJbnRlZ2VyLk9ORSkgIT0gMCAmJiB5LmNvbXBhcmVUbyhuMSkgIT0gMCkge1xuICAgICAgICAgICAgdmFyIGogPSAxO1xuICAgICAgICAgICAgd2hpbGUoaisrIDwgayAmJiB5LmNvbXBhcmVUbyhuMSkgIT0gMCkge1xuICAgICAgICAgICAgICAgIHkgPSB5Lm1vZFBvd0ludCgyLHRoaXMpO1xuICAgICAgICAgICAgICAgIGlmKHkuY29tcGFyZVRvKEJpZ0ludGVnZXIuT05FKSA9PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih5LmNvbXBhcmVUbyhuMSkgIT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG4vLyBwcm90ZWN0ZWRcbkJpZ0ludGVnZXIucHJvdG90eXBlLmNodW5rU2l6ZSA9IGJucENodW5rU2l6ZTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnRvUmFkaXggPSBibnBUb1JhZGl4O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZnJvbVJhZGl4ID0gYm5wRnJvbVJhZGl4O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZnJvbU51bWJlciA9IGJucEZyb21OdW1iZXI7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5iaXR3aXNlVG8gPSBibnBCaXR3aXNlVG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5jaGFuZ2VCaXQgPSBibnBDaGFuZ2VCaXQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5hZGRUbyA9IGJucEFkZFRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZE11bHRpcGx5ID0gYm5wRE11bHRpcGx5O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZEFkZE9mZnNldCA9IGJucERBZGRPZmZzZXQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5tdWx0aXBseUxvd2VyVG8gPSBibnBNdWx0aXBseUxvd2VyVG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5tdWx0aXBseVVwcGVyVG8gPSBibnBNdWx0aXBseVVwcGVyVG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5tb2RJbnQgPSBibnBNb2RJbnQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5taWxsZXJSYWJpbiA9IGJucE1pbGxlclJhYmluO1xuXG4vLyBwdWJsaWNcbkJpZ0ludGVnZXIucHJvdG90eXBlLmNsb25lID0gYm5DbG9uZTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmludFZhbHVlID0gYm5JbnRWYWx1ZTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmJ5dGVWYWx1ZSA9IGJuQnl0ZVZhbHVlO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuc2hvcnRWYWx1ZSA9IGJuU2hvcnRWYWx1ZTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnNpZ251bSA9IGJuU2lnTnVtO1xuQmlnSW50ZWdlci5wcm90b3R5cGUudG9CeXRlQXJyYXkgPSBiblRvQnl0ZUFycmF5O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZXF1YWxzID0gYm5FcXVhbHM7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5taW4gPSBibk1pbjtcbkJpZ0ludGVnZXIucHJvdG90eXBlLm1heCA9IGJuTWF4O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuYW5kID0gYm5BbmQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5vciA9IGJuT3I7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS54b3IgPSBiblhvcjtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmFuZE5vdCA9IGJuQW5kTm90O1xuQmlnSW50ZWdlci5wcm90b3R5cGUubm90ID0gYm5Ob3Q7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5zaGlmdExlZnQgPSBiblNoaWZ0TGVmdDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnNoaWZ0UmlnaHQgPSBiblNoaWZ0UmlnaHQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5nZXRMb3dlc3RTZXRCaXQgPSBibkdldExvd2VzdFNldEJpdDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmJpdENvdW50ID0gYm5CaXRDb3VudDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnRlc3RCaXQgPSBiblRlc3RCaXQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5zZXRCaXQgPSBiblNldEJpdDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmNsZWFyQml0ID0gYm5DbGVhckJpdDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmZsaXBCaXQgPSBibkZsaXBCaXQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5hZGQgPSBibkFkZDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnN1YnRyYWN0ID0gYm5TdWJ0cmFjdDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLm11bHRpcGx5ID0gYm5NdWx0aXBseTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmRpdmlkZSA9IGJuRGl2aWRlO1xuQmlnSW50ZWdlci5wcm90b3R5cGUucmVtYWluZGVyID0gYm5SZW1haW5kZXI7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5kaXZpZGVBbmRSZW1haW5kZXIgPSBibkRpdmlkZUFuZFJlbWFpbmRlcjtcbkJpZ0ludGVnZXIucHJvdG90eXBlLm1vZFBvdyA9IGJuTW9kUG93O1xuQmlnSW50ZWdlci5wcm90b3R5cGUubW9kSW52ZXJzZSA9IGJuTW9kSW52ZXJzZTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnBvdyA9IGJuUG93O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZ2NkID0gYm5HQ0Q7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5pc1Byb2JhYmxlUHJpbWUgPSBibklzUHJvYmFibGVQcmltZTtcblxuLy8gSlNCTi1zcGVjaWZpYyBleHRlbnNpb25cbkJpZ0ludGVnZXIucHJvdG90eXBlLnNxdWFyZSA9IGJuU3F1YXJlO1xuXG4vLyBCaWdJbnRlZ2VyIGludGVyZmFjZXMgbm90IGltcGxlbWVudGVkIGluIGpzYm46XG5cbi8vIEJpZ0ludGVnZXIoaW50IHNpZ251bSwgYnl0ZVtdIG1hZ25pdHVkZSlcbi8vIGRvdWJsZSBkb3VibGVWYWx1ZSgpXG4vLyBmbG9hdCBmbG9hdFZhbHVlKClcbi8vIGludCBoYXNoQ29kZSgpXG4vLyBsb25nIGxvbmdWYWx1ZSgpXG4vLyBzdGF0aWMgQmlnSW50ZWdlciB2YWx1ZU9mKGxvbmcgdmFsKVxuXG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHJzYS5qcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBEZXBlbmRzIG9uIGpzYm4uanMgYW5kIHJuZy5qc1xuXG4vLyBWZXJzaW9uIDEuMTogc3VwcG9ydCB1dGYtOCBlbmNvZGluZyBpbiBwa2NzMXBhZDJcblxuLy8gY29udmVydCBhIChoZXgpIHN0cmluZyB0byBhIGJpZ251bSBvYmplY3RcbmZ1bmN0aW9uIHBhcnNlQmlnSW50KHN0cixyKSB7XG4gICAgcmV0dXJuIG5ldyBCaWdJbnRlZ2VyKHN0cixyKTtcbn1cblxuZnVuY3Rpb24gbGluZWJyayhzLG4pIHtcbiAgICB2YXIgcmV0ID0gXCJcIjtcbiAgICB2YXIgaSA9IDA7XG4gICAgd2hpbGUoaSArIG4gPCBzLmxlbmd0aCkge1xuICAgICAgICByZXQgKz0gcy5zdWJzdHJpbmcoaSxpK24pICsgXCJcXG5cIjtcbiAgICAgICAgaSArPSBuO1xuICAgIH1cbiAgICByZXR1cm4gcmV0ICsgcy5zdWJzdHJpbmcoaSxzLmxlbmd0aCk7XG59XG5cbmZ1bmN0aW9uIGJ5dGUySGV4KGIpIHtcbiAgICBpZihiIDwgMHgxMClcbiAgICAgICAgcmV0dXJuIFwiMFwiICsgYi50b1N0cmluZygxNik7XG4gICAgZWxzZVxuICAgICAgICByZXR1cm4gYi50b1N0cmluZygxNik7XG59XG5cbi8vIFBLQ1MjMSAodHlwZSAyLCByYW5kb20pIHBhZCBpbnB1dCBzdHJpbmcgcyB0byBuIGJ5dGVzLCBhbmQgcmV0dXJuIGEgYmlnaW50XG5mdW5jdGlvbiBwa2NzMXBhZDIocyxuKSB7XG4gICAgaWYobiA8IHMubGVuZ3RoICsgMTEpIHsgLy8gVE9ETzogZml4IGZvciB1dGYtOFxuICAgICAgICBhbGVydChcIk1lc3NhZ2UgdG9vIGxvbmcgZm9yIFJTQVwiKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBiYSA9IG5ldyBBcnJheSgpO1xuICAgIHZhciBpID0gcy5sZW5ndGggLSAxO1xuICAgIHdoaWxlKGkgPj0gMCAmJiBuID4gMCkge1xuICAgICAgICB2YXIgYyA9IHMuY2hhckNvZGVBdChpLS0pO1xuICAgICAgICBpZihjIDwgMTI4KSB7IC8vIGVuY29kZSB1c2luZyB1dGYtOFxuICAgICAgICAgICAgYmFbLS1uXSA9IGM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZigoYyA+IDEyNykgJiYgKGMgPCAyMDQ4KSkge1xuICAgICAgICAgICAgYmFbLS1uXSA9IChjICYgNjMpIHwgMTI4O1xuICAgICAgICAgICAgYmFbLS1uXSA9IChjID4+IDYpIHwgMTkyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYmFbLS1uXSA9IChjICYgNjMpIHwgMTI4O1xuICAgICAgICAgICAgYmFbLS1uXSA9ICgoYyA+PiA2KSAmIDYzKSB8IDEyODtcbiAgICAgICAgICAgIGJhWy0tbl0gPSAoYyA+PiAxMikgfCAyMjQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYmFbLS1uXSA9IDA7XG4gICAgdmFyIHJuZyA9IG5ldyBTZWN1cmVSYW5kb20oKTtcbiAgICB2YXIgeCA9IG5ldyBBcnJheSgpO1xuICAgIHdoaWxlKG4gPiAyKSB7IC8vIHJhbmRvbSBub24temVybyBwYWRcbiAgICAgICAgeFswXSA9IDA7XG4gICAgICAgIHdoaWxlKHhbMF0gPT0gMCkgcm5nLm5leHRCeXRlcyh4KTtcbiAgICAgICAgYmFbLS1uXSA9IHhbMF07XG4gICAgfVxuICAgIGJhWy0tbl0gPSAyO1xuICAgIGJhWy0tbl0gPSAwO1xuICAgIHJldHVybiBuZXcgQmlnSW50ZWdlcihiYSk7XG59XG5cbi8vIFwiZW1wdHlcIiBSU0Ega2V5IGNvbnN0cnVjdG9yXG5mdW5jdGlvbiBSU0FLZXkoKSB7XG4gICAgdGhpcy5uID0gbnVsbDtcbiAgICB0aGlzLmUgPSAwO1xuICAgIHRoaXMuZCA9IG51bGw7XG4gICAgdGhpcy5wID0gbnVsbDtcbiAgICB0aGlzLnEgPSBudWxsO1xuICAgIHRoaXMuZG1wMSA9IG51bGw7XG4gICAgdGhpcy5kbXExID0gbnVsbDtcbiAgICB0aGlzLmNvZWZmID0gbnVsbDtcbn1cblxuLy8gU2V0IHRoZSBwdWJsaWMga2V5IGZpZWxkcyBOIGFuZCBlIGZyb20gaGV4IHN0cmluZ3NcbmZ1bmN0aW9uIFJTQVNldFB1YmxpYyhOLEUpIHtcbiAgICBpZihOICE9IG51bGwgJiYgRSAhPSBudWxsICYmIE4ubGVuZ3RoID4gMCAmJiBFLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhpcy5uID0gcGFyc2VCaWdJbnQoTiwxNik7XG4gICAgICAgIHRoaXMuZSA9IHBhcnNlSW50KEUsMTYpO1xuICAgIH1cbiAgICBlbHNlXG4gICAgICAgIGFsZXJ0KFwiSW52YWxpZCBSU0EgcHVibGljIGtleVwiKTtcbn1cblxuLy8gUGVyZm9ybSByYXcgcHVibGljIG9wZXJhdGlvbiBvbiBcInhcIjogcmV0dXJuIHheZSAobW9kIG4pXG5mdW5jdGlvbiBSU0FEb1B1YmxpYyh4KSB7XG4gICAgcmV0dXJuIHgubW9kUG93SW50KHRoaXMuZSwgdGhpcy5uKTtcbn1cblxuLy8gUmV0dXJuIHRoZSBQS0NTIzEgUlNBIGVuY3J5cHRpb24gb2YgXCJ0ZXh0XCIgYXMgYW4gZXZlbi1sZW5ndGggaGV4IHN0cmluZ1xuZnVuY3Rpb24gUlNBRW5jcnlwdCh0ZXh0KSB7XG4gICAgdmFyIG0gPSBwa2NzMXBhZDIodGV4dCwodGhpcy5uLmJpdExlbmd0aCgpKzcpPj4zKTtcbiAgICBpZihtID09IG51bGwpIHJldHVybiBudWxsO1xuICAgIHZhciBjID0gdGhpcy5kb1B1YmxpYyhtKTtcbiAgICBpZihjID09IG51bGwpIHJldHVybiBudWxsO1xuICAgIHZhciBoID0gYy50b1N0cmluZygxNik7XG4gICAgaWYoKGgubGVuZ3RoICYgMSkgPT0gMCkgcmV0dXJuIGg7IGVsc2UgcmV0dXJuIFwiMFwiICsgaDtcbn1cblxuLy8gUmV0dXJuIHRoZSBQS0NTIzEgUlNBIGVuY3J5cHRpb24gb2YgXCJ0ZXh0XCIgYXMgYSBCYXNlNjQtZW5jb2RlZCBzdHJpbmdcbi8vZnVuY3Rpb24gUlNBRW5jcnlwdEI2NCh0ZXh0KSB7XG4vLyAgdmFyIGggPSB0aGlzLmVuY3J5cHQodGV4dCk7XG4vLyAgaWYoaCkgcmV0dXJuIGhleDJiNjQoaCk7IGVsc2UgcmV0dXJuIG51bGw7XG4vL31cblxuLy8gcHJvdGVjdGVkXG5SU0FLZXkucHJvdG90eXBlLmRvUHVibGljID0gUlNBRG9QdWJsaWM7XG5cbi8vIHB1YmxpY1xuUlNBS2V5LnByb3RvdHlwZS5zZXRQdWJsaWMgPSBSU0FTZXRQdWJsaWM7XG5SU0FLZXkucHJvdG90eXBlLmVuY3J5cHQgPSBSU0FFbmNyeXB0O1xuLy9SU0FLZXkucHJvdG90eXBlLmVuY3J5cHRfYjY0ID0gUlNBRW5jcnlwdEI2NDtcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gcnNhMi5qcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBEZXBlbmRzIG9uIHJzYS5qcyBhbmQganNibjIuanNcblxuLy8gVmVyc2lvbiAxLjE6IHN1cHBvcnQgdXRmLTggZGVjb2RpbmcgaW4gcGtjczF1bnBhZDJcblxuLy8gVW5kbyBQS0NTIzEgKHR5cGUgMiwgcmFuZG9tKSBwYWRkaW5nIGFuZCwgaWYgdmFsaWQsIHJldHVybiB0aGUgcGxhaW50ZXh0XG5mdW5jdGlvbiBwa2NzMXVucGFkMihkLG4pIHtcbiAgICB2YXIgYiA9IGQudG9CeXRlQXJyYXkoKTtcbiAgICB2YXIgaSA9IDA7XG4gICAgd2hpbGUoaSA8IGIubGVuZ3RoICYmIGJbaV0gPT0gMCkgKytpO1xuICAgIGlmKGIubGVuZ3RoLWkgIT0gbi0xIHx8IGJbaV0gIT0gMilcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgKytpO1xuICAgIHdoaWxlKGJbaV0gIT0gMClcbiAgICAgICAgaWYoKytpID49IGIubGVuZ3RoKSByZXR1cm4gbnVsbDtcbiAgICB2YXIgcmV0ID0gXCJcIjtcbiAgICB3aGlsZSgrK2kgPCBiLmxlbmd0aCkge1xuICAgICAgICB2YXIgYyA9IGJbaV0gJiAyNTU7XG4gICAgICAgIGlmKGMgPCAxMjgpIHsgLy8gdXRmLTggZGVjb2RlXG4gICAgICAgICAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKChjID4gMTkxKSAmJiAoYyA8IDIyNCkpIHtcbiAgICAgICAgICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYyAmIDMxKSA8PCA2KSB8IChiW2krMV0gJiA2MykpO1xuICAgICAgICAgICAgKytpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKChjICYgMTUpIDw8IDEyKSB8ICgoYltpKzFdICYgNjMpIDw8IDYpIHwgKGJbaSsyXSAmIDYzKSk7XG4gICAgICAgICAgICBpICs9IDI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gcGtjczF1bnBhZDJfYnVmZmVyKGQsbikge1xuICAgIHZhciBiID0gZC50b0J5dGVBcnJheSgpO1xuICAgIHZhciBpID0gMDtcbiAgICB3aGlsZShpIDwgYi5sZW5ndGggJiYgYltpXSA9PSAwKSArK2k7XG4gICAgaWYoYi5sZW5ndGgtaSAhPSBuLTEgfHwgYltpXSAhPSAyKVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICArK2k7XG4gICAgd2hpbGUoYltpXSAhPSAwKVxuICAgICAgICBpZigrK2kgPj0gYi5sZW5ndGgpIHJldHVybiBudWxsO1xuICAgIHZhciByZXQgPSBcIlwiO1xuICAgIGkrKztcbiAgICB2YXIgcnQ9bmV3IFVpbnQ4QXJyYXkoYi5sZW5ndGgtaSk7XG4gICAgdmFyIHN0YXJ0PTA7XG4gICAgd2hpbGUgKGk8IGIubGVuZ3RoKXtcbiAgICAgICAgcnRbc3RhcnRdPWJbaV0mMjU1O1xuICAgICAgICBpKys7XG4gICAgICAgIHN0YXJ0Kys7XG4gICAgfVxuICAgIHJldHVybiBydDtcbn1cblxuXG4vLyBTZXQgdGhlIHByaXZhdGUga2V5IGZpZWxkcyBOLCBlLCBhbmQgZCBmcm9tIGhleCBzdHJpbmdzXG5mdW5jdGlvbiBSU0FTZXRQcml2YXRlKE4sRSxEKSB7XG4gICAgaWYoTiAhPSBudWxsICYmIEUgIT0gbnVsbCAmJiBOLmxlbmd0aCA+IDAgJiYgRS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMubiA9IHBhcnNlQmlnSW50KE4sMTYpO1xuICAgICAgICB0aGlzLmUgPSBwYXJzZUludChFLDE2KTtcbiAgICAgICAgdGhpcy5kID0gcGFyc2VCaWdJbnQoRCwxNik7XG4gICAgfVxuICAgIGVsc2VcbiAgICAgICAgYWxlcnQoXCJJbnZhbGlkIFJTQSBwcml2YXRlIGtleVwiKTtcbn1cblxuLy8gU2V0IHRoZSBwcml2YXRlIGtleSBmaWVsZHMgTiwgZSwgZCBhbmQgQ1JUIHBhcmFtcyBmcm9tIGhleCBzdHJpbmdzXG5mdW5jdGlvbiBSU0FTZXRQcml2YXRlRXgoTixFLEQsUCxRLERQLERRLEMpIHtcbiAgICBpZihOICE9IG51bGwgJiYgRSAhPSBudWxsICYmIE4ubGVuZ3RoID4gMCAmJiBFLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhpcy5uID0gcGFyc2VCaWdJbnQoTiwxNik7XG4gICAgICAgIHRoaXMuZSA9IHBhcnNlSW50KEUsMTYpO1xuICAgICAgICB0aGlzLmQgPSBwYXJzZUJpZ0ludChELDE2KTtcbiAgICAgICAgdGhpcy5wID0gcGFyc2VCaWdJbnQoUCwxNik7XG4gICAgICAgIHRoaXMucSA9IHBhcnNlQmlnSW50KFEsMTYpO1xuICAgICAgICB0aGlzLmRtcDEgPSBwYXJzZUJpZ0ludChEUCwxNik7XG4gICAgICAgIHRoaXMuZG1xMSA9IHBhcnNlQmlnSW50KERRLDE2KTtcbiAgICAgICAgdGhpcy5jb2VmZiA9IHBhcnNlQmlnSW50KEMsMTYpO1xuICAgIH1cbiAgICBlbHNlXG4gICAgICAgIGFsZXJ0KFwiSW52YWxpZCBSU0EgcHJpdmF0ZSBrZXlcIik7XG59XG5cbi8vIEdlbmVyYXRlIGEgbmV3IHJhbmRvbSBwcml2YXRlIGtleSBCIGJpdHMgbG9uZywgdXNpbmcgcHVibGljIGV4cHQgRVxuZnVuY3Rpb24gUlNBR2VuZXJhdGUoQixFKSB7XG4gICAgdmFyIHJuZyA9IG5ldyBTZWN1cmVSYW5kb20oKTtcbiAgICB2YXIgcXMgPSBCPj4xO1xuICAgIHRoaXMuZSA9IHBhcnNlSW50KEUsMTYpO1xuICAgIHZhciBlZSA9IG5ldyBCaWdJbnRlZ2VyKEUsMTYpO1xuICAgIGZvcig7Oykge1xuICAgICAgICBmb3IoOzspIHtcbiAgICAgICAgICAgIHRoaXMucCA9IG5ldyBCaWdJbnRlZ2VyKEItcXMsMSxybmcpO1xuICAgICAgICAgICAgaWYodGhpcy5wLnN1YnRyYWN0KEJpZ0ludGVnZXIuT05FKS5nY2QoZWUpLmNvbXBhcmVUbyhCaWdJbnRlZ2VyLk9ORSkgPT0gMCAmJiB0aGlzLnAuaXNQcm9iYWJsZVByaW1lKDEwKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgZm9yKDs7KSB7XG4gICAgICAgICAgICB0aGlzLnEgPSBuZXcgQmlnSW50ZWdlcihxcywxLHJuZyk7XG4gICAgICAgICAgICBpZih0aGlzLnEuc3VidHJhY3QoQmlnSW50ZWdlci5PTkUpLmdjZChlZSkuY29tcGFyZVRvKEJpZ0ludGVnZXIuT05FKSA9PSAwICYmIHRoaXMucS5pc1Byb2JhYmxlUHJpbWUoMTApKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLnAuY29tcGFyZVRvKHRoaXMucSkgPD0gMCkge1xuICAgICAgICAgICAgdmFyIHQgPSB0aGlzLnA7XG4gICAgICAgICAgICB0aGlzLnAgPSB0aGlzLnE7XG4gICAgICAgICAgICB0aGlzLnEgPSB0O1xuICAgICAgICB9XG4gICAgICAgIHZhciBwMSA9IHRoaXMucC5zdWJ0cmFjdChCaWdJbnRlZ2VyLk9ORSk7XG4gICAgICAgIHZhciBxMSA9IHRoaXMucS5zdWJ0cmFjdChCaWdJbnRlZ2VyLk9ORSk7XG4gICAgICAgIHZhciBwaGkgPSBwMS5tdWx0aXBseShxMSk7XG4gICAgICAgIGlmKHBoaS5nY2QoZWUpLmNvbXBhcmVUbyhCaWdJbnRlZ2VyLk9ORSkgPT0gMCkge1xuICAgICAgICAgICAgdGhpcy5uID0gdGhpcy5wLm11bHRpcGx5KHRoaXMucSk7XG4gICAgICAgICAgICB0aGlzLmQgPSBlZS5tb2RJbnZlcnNlKHBoaSk7XG4gICAgICAgICAgICB0aGlzLmRtcDEgPSB0aGlzLmQubW9kKHAxKTtcbiAgICAgICAgICAgIHRoaXMuZG1xMSA9IHRoaXMuZC5tb2QocTEpO1xuICAgICAgICAgICAgdGhpcy5jb2VmZiA9IHRoaXMucS5tb2RJbnZlcnNlKHRoaXMucCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gUGVyZm9ybSByYXcgcHJpdmF0ZSBvcGVyYXRpb24gb24gXCJ4XCI6IHJldHVybiB4XmQgKG1vZCBuKVxuZnVuY3Rpb24gUlNBRG9Qcml2YXRlKHgpIHtcbiAgICBpZih0aGlzLnAgPT0gbnVsbCB8fCB0aGlzLnEgPT0gbnVsbClcbiAgICAgICAgcmV0dXJuIHgubW9kUG93KHRoaXMuZCwgdGhpcy5uKTtcblxuICAgIC8vIFRPRE86IHJlLWNhbGN1bGF0ZSBhbnkgbWlzc2luZyBDUlQgcGFyYW1zXG4gICAgdmFyIHhwID0geC5tb2QodGhpcy5wKS5tb2RQb3codGhpcy5kbXAxLCB0aGlzLnApO1xuICAgIHZhciB4cSA9IHgubW9kKHRoaXMucSkubW9kUG93KHRoaXMuZG1xMSwgdGhpcy5xKTtcblxuICAgIHdoaWxlKHhwLmNvbXBhcmVUbyh4cSkgPCAwKVxuICAgICAgICB4cCA9IHhwLmFkZCh0aGlzLnApO1xuICAgIHJldHVybiB4cC5zdWJ0cmFjdCh4cSkubXVsdGlwbHkodGhpcy5jb2VmZikubW9kKHRoaXMucCkubXVsdGlwbHkodGhpcy5xKS5hZGQoeHEpO1xufVxuXG4vLyBSZXR1cm4gdGhlIFBLQ1MjMSBSU0EgZGVjcnlwdGlvbiBvZiBcImN0ZXh0XCIuXG4vLyBcImN0ZXh0XCIgaXMgYW4gZXZlbi1sZW5ndGggaGV4IHN0cmluZyBhbmQgdGhlIG91dHB1dCBpcyBhIHBsYWluIHN0cmluZy5cbmZ1bmN0aW9uIFJTQURlY3J5cHQoY3RleHQpIHtcbiAgICB2YXIgYyA9IHBhcnNlQmlnSW50KGN0ZXh0LCAxNik7XG4gICAgdmFyIG0gPSB0aGlzLmRvUHJpdmF0ZShjKTtcbiAgICBpZihtID09IG51bGwpIHJldHVybiBudWxsO1xuICAgIHJldHVybiBwa2NzMXVucGFkMihtLCAodGhpcy5uLmJpdExlbmd0aCgpKzcpPj4zKTtcbn1cblxuZnVuY3Rpb24gUlNBRGVjcnlwdEJ1ZmZlcihjdGV4dCkge1xuICAgIHZhciBjID0gcGFyc2VCaWdJbnQoY3RleHQsIDE2KTtcbiAgICB2YXIgbSA9IHRoaXMuZG9Qcml2YXRlKGMpO1xuICAgIGlmKG0gPT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHBrY3MxdW5wYWQyX2J1ZmZlcihtLCAodGhpcy5uLmJpdExlbmd0aCgpKzcpPj4zKTtcbn1cblxuLy8gUmV0dXJuIHRoZSBQS0NTIzEgUlNBIGRlY3J5cHRpb24gb2YgXCJjdGV4dFwiLlxuLy8gXCJjdGV4dFwiIGlzIGEgQmFzZTY0LWVuY29kZWQgc3RyaW5nIGFuZCB0aGUgb3V0cHV0IGlzIGEgcGxhaW4gc3RyaW5nLlxuLy9mdW5jdGlvbiBSU0FCNjREZWNyeXB0KGN0ZXh0KSB7XG4vLyAgdmFyIGggPSBiNjR0b2hleChjdGV4dCk7XG4vLyAgaWYoaCkgcmV0dXJuIHRoaXMuZGVjcnlwdChoKTsgZWxzZSByZXR1cm4gbnVsbDtcbi8vfVxuXG4vLyBwcm90ZWN0ZWRcblJTQUtleS5wcm90b3R5cGUuZG9Qcml2YXRlID0gUlNBRG9Qcml2YXRlO1xuXG4vLyBwdWJsaWNcblJTQUtleS5wcm90b3R5cGUuc2V0UHJpdmF0ZSA9IFJTQVNldFByaXZhdGU7XG5SU0FLZXkucHJvdG90eXBlLnNldFByaXZhdGVFeCA9IFJTQVNldFByaXZhdGVFeDtcblJTQUtleS5wcm90b3R5cGUuZ2VuZXJhdGUgPSBSU0FHZW5lcmF0ZTtcblJTQUtleS5wcm90b3R5cGUuZGVjcnlwdCA9IFJTQURlY3J5cHQ7XG5SU0FLZXkucHJvdG90eXBlLmRlY3J5cHRCdWZmZXI9IFJTQURlY3J5cHRCdWZmZXI7XG4vL1JTQUtleS5wcm90b3R5cGUuYjY0X2RlY3J5cHQgPSBSU0FCNjREZWNyeXB0O1xuXG5tb2R1bGUuZXhwb3J0cz1SU0FLZXk7Il0sInNvdXJjZVJvb3QiOiIifQ==