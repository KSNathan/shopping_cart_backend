/* Respond.js: min/max-width media query polyfill. (c) Scott Jehl. MIT Lic. j.mp/respondjs  */ 
2 (function( w ){ 
3 
 
4 	"use strict"; 
5 
 
6 	//exposed namespace 
7 	var respond = {}; 
8 	w.respond = respond; 
9 
 
10 	//define update even in native-mq-supporting browsers, to avoid errors 
11 	respond.update = function(){}; 
12 
 
13 	//define ajax obj 
14 	var requestQueue = [], 
15 		xmlHttp = (function() { 
16 			var xmlhttpmethod = false; 
17 			try { 
18 				xmlhttpmethod = new w.XMLHttpRequest(); 
19 			} 
20 			catch( e ){ 
21 				xmlhttpmethod = new w.ActiveXObject( "Microsoft.XMLHTTP" ); 
22 			} 
23 			return function(){ 
24 				return xmlhttpmethod; 
25 			}; 
26 		})(), 
27 
 
28 		//tweaked Ajax functions from Quirksmode 
29 		ajax = function( url, callback ) { 
30 			var req = xmlHttp(); 
31 			if (!req){ 
32 				return; 
33 			} 
34 			req.open( "GET", url, true ); 
35 			req.onreadystatechange = function () { 
36 				if ( req.readyState !== 4 || req.status !== 200 && req.status !== 304 ){ 
37 					return; 
38 				} 
39 				callback( req.responseText ); 
40 			}; 
41 			if ( req.readyState === 4 ){ 
42 				return; 
43 			} 
44 			req.send( null ); 
45 		}, 
46 		isUnsupportedMediaQuery = function( query ) { 
47 			return query.replace( respond.regex.minmaxwh, '' ).match( respond.regex.other ); 
48 		}; 
49 
 
50 	//expose for testing 
51 	respond.ajax = ajax; 
52 	respond.queue = requestQueue; 
53 	respond.unsupportedmq = isUnsupportedMediaQuery; 
54 	respond.regex = { 
55 		media: /@media[^\{]+\{([^\{\}]*\{[^\}\{]*\})+/gi, 
56 		keyframes: /@(?:\-(?:o|moz|webkit)\-)?keyframes[^\{]+\{(?:[^\{\}]*\{[^\}\{]*\})+[^\}]*\}/gi, 
57 		comments: /\/\*[^*]*\*+([^/][^*]*\*+)*\//gi, 
58 		urls: /(url\()['"]?([^\/\)'"][^:\)'"]+)['"]?(\))/g, 
59 		findStyles: /@media *([^\{]+)\{([\S\s]+?)$/, 
60 		only: /(only\s+)?([a-zA-Z]+)\s?/, 
61 		minw: /\(\s*min\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/, 
62 		maxw: /\(\s*max\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/, 
63 		minmaxwh: /\(\s*m(in|ax)\-(height|width)\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/gi, 
64 		other: /\([^\)]*\)/g 
65 	}; 
66 
 
67 	//expose media query support flag for external use 
68 	respond.mediaQueriesSupported = w.matchMedia && w.matchMedia( "only all" ) !== null && w.matchMedia( "only all" ).matches; 
69 
 
70 	//if media queries are supported, exit here 
71 	if( respond.mediaQueriesSupported ){ 
72 		return; 
73 	} 
74 
 
75 	//define vars 
76 	var doc = w.document, 
77 		docElem = doc.documentElement, 
78 		mediastyles = [], 
79 		rules = [], 
80 		appendedEls = [], 
81 		parsedSheets = {}, 
82 		resizeThrottle = 30, 
83 		head = doc.getElementsByTagName( "head" )[0] || docElem, 
84 		base = doc.getElementsByTagName( "base" )[0], 
85 		links = head.getElementsByTagName( "link" ), 
86 
 
87 		lastCall, 
88 		resizeDefer, 
89 
 
90 		//cached container for 1em value, populated the first time it's needed 
91 		eminpx, 
92 
 
93 		// returns the value of 1em in pixels 
94 		getEmValue = function() { 
95 			var ret, 
96 				div = doc.createElement('div'), 
97 				body = doc.body, 
98 				originalHTMLFontSize = docElem.style.fontSize, 
99 				originalBodyFontSize = body && body.style.fontSize, 
100 				fakeUsed = false; 
101 
 
102 			div.style.cssText = "position:absolute;font-size:1em;width:1em"; 
103 
 
104 			if( !body ){ 
105 				body = fakeUsed = doc.createElement( "body" ); 
106 				body.style.background = "none"; 
107 			} 
108 
 
109 			// 1em in a media query is the value of the default font size of the browser 
110 			// reset docElem and body to ensure the correct value is returned 
111 			docElem.style.fontSize = "100%"; 
112 			body.style.fontSize = "100%"; 
113 
 
114 			body.appendChild( div ); 
115 
 
116 			if( fakeUsed ){ 
117 				docElem.insertBefore( body, docElem.firstChild ); 
118 			} 
119 
 
120 			ret = div.offsetWidth; 
121 
 
122 			if( fakeUsed ){ 
123 				docElem.removeChild( body ); 
124 			} 
125 			else { 
126 				body.removeChild( div ); 
127 			} 
128 
 
129 			// restore the original values 
130 			docElem.style.fontSize = originalHTMLFontSize; 
131 			if( originalBodyFontSize ) { 
132 				body.style.fontSize = originalBodyFontSize; 
133 			} 
134 
 
135 
 
136 			//also update eminpx before returning 
137 			ret = eminpx = parseFloat(ret); 
138 
 
139 			return ret; 
140 		}, 
141 
 
142 		//enable/disable styles 
143 		applyMedia = function( fromResize ){ 
144 			var name = "clientWidth", 
145 				docElemProp = docElem[ name ], 
146 				currWidth = doc.compatMode === "CSS1Compat" && docElemProp || doc.body[ name ] || docElemProp, 
147 				styleBlocks	= {}, 
148 				lastLink = links[ links.length-1 ], 
149 				now = (new Date()).getTime(); 
150 
 
151 			//throttle resize calls 
152 			if( fromResize && lastCall && now - lastCall < resizeThrottle ){ 
153 				w.clearTimeout( resizeDefer ); 
154 				resizeDefer = w.setTimeout( applyMedia, resizeThrottle ); 
155 				return; 
156 			} 
157 			else { 
158 				lastCall = now; 
159 			} 
160 
 
161 			for( var i in mediastyles ){ 
162 				if( mediastyles.hasOwnProperty( i ) ){ 
163 					var thisstyle = mediastyles[ i ], 
164 						min = thisstyle.minw, 
165 						max = thisstyle.maxw, 
166 						minnull = min === null, 
167 						maxnull = max === null, 
168 						em = "em"; 
169 
 
170 					if( !!min ){ 
171 						min = parseFloat( min ) * ( min.indexOf( em ) > -1 ? ( eminpx || getEmValue() ) : 1 ); 
172 					} 
173 					if( !!max ){ 
174 						max = parseFloat( max ) * ( max.indexOf( em ) > -1 ? ( eminpx || getEmValue() ) : 1 ); 
175 					} 
176 
 
177 					// if there's no media query at all (the () part), or min or max is not null, and if either is present, they're true 
178 					if( !thisstyle.hasquery || ( !minnull || !maxnull ) && ( minnull || currWidth >= min ) && ( maxnull || currWidth <= max ) ){ 
179 						if( !styleBlocks[ thisstyle.media ] ){ 
180 							styleBlocks[ thisstyle.media ] = []; 
181 						} 
182 						styleBlocks[ thisstyle.media ].push( rules[ thisstyle.rules ] ); 
183 					} 
184 				} 
185 			} 
186 
 
187 			//remove any existing respond style element(s) 
188 			for( var j in appendedEls ){ 
189 				if( appendedEls.hasOwnProperty( j ) ){ 
190 					if( appendedEls[ j ] && appendedEls[ j ].parentNode === head ){ 
191 						head.removeChild( appendedEls[ j ] ); 
192 					} 
193 				} 
194 			} 
195 			appendedEls.length = 0; 
196 
 
197 			//inject active styles, grouped by media type 
198 			for( var k in styleBlocks ){ 
199 				if( styleBlocks.hasOwnProperty( k ) ){ 
200 					var ss = doc.createElement( "style" ), 
201 						css = styleBlocks[ k ].join( "\n" ); 
202 
 
203 					ss.type = "text/css"; 
204 					ss.media = k; 
205 
 
206 					//originally, ss was appended to a documentFragment and sheets were appended in bulk. 
207 					//this caused crashes in IE in a number of circumstances, such as when the HTML element had a bg image set, so appending beforehand seems best. Thanks to @dvelyk for the initial research on this one! 
208 					head.insertBefore( ss, lastLink.nextSibling ); 
209 
 
210 					if ( ss.styleSheet ){ 
211 						ss.styleSheet.cssText = css; 
212 					} 
213 					else { 
214 						ss.appendChild( doc.createTextNode( css ) ); 
215 					} 
216 
 
217 					//push to appendedEls to track for later removal 
218 					appendedEls.push( ss ); 
219 				} 
220 			} 
221 		}, 
222 		//find media blocks in css text, convert to style blocks 
223 		translate = function( styles, href, media ){ 
224 			var qs = styles.replace( respond.regex.comments, '' ) 
225 					.replace( respond.regex.keyframes, '' ) 
226 					.match( respond.regex.media ), 
227 				ql = qs && qs.length || 0; 
228 
 
229 			//try to get CSS path 
230 			href = href.substring( 0, href.lastIndexOf( "/" ) ); 
231 
 
232 			var repUrls = function( css ){ 
233 					return css.replace( respond.regex.urls, "$1" + href + "$2$3" ); 
234 				}, 
235 				useMedia = !ql && media; 
236 
 
237 			//if path exists, tack on trailing slash 
238 			if( href.length ){ href += "/"; } 
239 
 
240 			//if no internal queries exist, but media attr does, use that 
241 			//note: this currently lacks support for situations where a media attr is specified on a link AND 
242 				//its associated stylesheet has internal CSS media queries. 
243 				//In those cases, the media attribute will currently be ignored. 
244 			if( useMedia ){ 
245 				ql = 1; 
246 			} 
247 
 
248 			for( var i = 0; i < ql; i++ ){ 
249 				var fullq, thisq, eachq, eql; 
250 
 
251 				//media attr 
252 				if( useMedia ){ 
253 					fullq = media; 
254 					rules.push( repUrls( styles ) ); 
255 				} 
256 				//parse for styles 
257 				else{ 
258 					fullq = qs[ i ].match( respond.regex.findStyles ) && RegExp.$1; 
259 					rules.push( RegExp.$2 && repUrls( RegExp.$2 ) ); 
260 				} 
261 
 
262 				eachq = fullq.split( "," ); 
263 				eql = eachq.length; 
264 
 
265 				for( var j = 0; j < eql; j++ ){ 
266 					thisq = eachq[ j ]; 
267 
 
268 					if( isUnsupportedMediaQuery( thisq ) ) { 
269 						continue; 
270 					} 
271 
 
272 					mediastyles.push( { 
273 						media : thisq.split( "(" )[ 0 ].match( respond.regex.only ) && RegExp.$2 || "all", 
274 						rules : rules.length - 1, 
275 						hasquery : thisq.indexOf("(") > -1, 
276 						minw : thisq.match( respond.regex.minw ) && parseFloat( RegExp.$1 ) + ( RegExp.$2 || "" ), 
277 						maxw : thisq.match( respond.regex.maxw ) && parseFloat( RegExp.$1 ) + ( RegExp.$2 || "" ) 
278 					} ); 
279 				} 
280 			} 
281 
 
282 			applyMedia(); 
283 		}, 
284 
 
285 		//recurse through request queue, get css text 
286 		makeRequests = function(){ 
287 			if( requestQueue.length ){ 
288 				var thisRequest = requestQueue.shift(); 
289 
 
290 				ajax( thisRequest.href, function( styles ){ 
291 					translate( styles, thisRequest.href, thisRequest.media ); 
292 					parsedSheets[ thisRequest.href ] = true; 
293 
 
294 					// by wrapping recursive function call in setTimeout 
295 					// we prevent "Stack overflow" error in IE7 
296 					w.setTimeout(function(){ makeRequests(); },0); 
297 				} ); 
298 			} 
299 		}, 
300 
 
301 		//loop stylesheets, send text content to translate 
302 		ripCSS = function(){ 
303 
 
304 			for( var i = 0; i < links.length; i++ ){ 
305 				var sheet = links[ i ], 
306 				href = sheet.href, 
307 				media = sheet.media, 
308 				isCSS = sheet.rel && sheet.rel.toLowerCase() === "stylesheet"; 
309 
 
310 				//only links plz and prevent re-parsing 
311 				if( !!href && isCSS && !parsedSheets[ href ] ){ 
312 					// selectivizr exposes css through the rawCssText expando 
313 					if (sheet.styleSheet && sheet.styleSheet.rawCssText) { 
314 						translate( sheet.styleSheet.rawCssText, href, media ); 
315 						parsedSheets[ href ] = true; 
316 					} else { 
317 						if( (!/^([a-zA-Z:]*\/\/)/.test( href ) && !base) || 
318 							href.replace( RegExp.$1, "" ).split( "/" )[0] === w.location.host ){ 
319 							// IE7 doesn't handle urls that start with '//' for ajax request 
320 							// manually add in the protocol 
321 							if ( href.substring(0,2) === "//" ) { href = w.location.protocol + href; } 
322 							requestQueue.push( { 
323 								href: href, 
324 								media: media 
325 							} ); 
326 						} 
327 					} 
328 				} 
329 			} 
330 			makeRequests(); 
331 		}; 
332 
 
333 	//translate CSS 
334 	ripCSS(); 
335 
 
336 	//expose update for re-running respond later on 
337 	respond.update = ripCSS; 
338 
 
339 	//expose getEmValue 
340 	respond.getEmValue = getEmValue; 
341 
 
342 	//adjust on resize 
343 	function callMedia(){ 
344 		applyMedia( true ); 
345 	} 
346 
 
347 	if( w.addEventListener ){ 
348 		w.addEventListener( "resize", callMedia, false ); 
349 	} 
350 	else if( w.attachEvent ){ 
351 		w.attachEvent( "onresize", callMedia ); 
352 	} 
353 })(this); 
