
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
	'use strict';

	/** @returns {void} */
	function noop() {}

	const identity = (x) => x;

	/**
	 * @template T
	 * @template S
	 * @param {T} tar
	 * @param {S} src
	 * @returns {T & S}
	 */
	function assign(tar, src) {
		// @ts-ignore
		for (const k in src) tar[k] = src[k];
		return /** @type {T & S} */ (tar);
	}

	/** @returns {void} */
	function add_location(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
		};
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	/**
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function run_all(fns) {
		fns.forEach(run);
	}

	/**
	 * @param {any} thing
	 * @returns {thing is Function}
	 */
	function is_function(thing) {
		return typeof thing === 'function';
	}

	/** @returns {boolean} */
	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
	}

	let src_url_equal_anchor;

	/**
	 * @param {string} element_src
	 * @param {string} url
	 * @returns {boolean}
	 */
	function src_url_equal(element_src, url) {
		if (element_src === url) return true;
		if (!src_url_equal_anchor) {
			src_url_equal_anchor = document.createElement('a');
		}
		// This is actually faster than doing URL(..).href
		src_url_equal_anchor.href = url;
		return element_src === src_url_equal_anchor.href;
	}

	/** @returns {boolean} */
	function is_empty(obj) {
		return Object.keys(obj).length === 0;
	}

	/** @returns {void} */
	function validate_store(store, name) {
		if (store != null && typeof store.subscribe !== 'function') {
			throw new Error(`'${name}' is not a store with a 'subscribe' method`);
		}
	}

	function subscribe(store, ...callbacks) {
		if (store == null) {
			for (const callback of callbacks) {
				callback(undefined);
			}
			return noop;
		}
		const unsub = store.subscribe(...callbacks);
		return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
	}

	/** @returns {void} */
	function component_subscribe(component, store, callback) {
		component.$$.on_destroy.push(subscribe(store, callback));
	}

	function create_slot(definition, ctx, $$scope, fn) {
		if (definition) {
			const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
			return definition[0](slot_ctx);
		}
	}

	function get_slot_context(definition, ctx, $$scope, fn) {
		return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
	}

	function get_slot_changes(definition, $$scope, dirty, fn) {
		if (definition[2] && fn) {
			const lets = definition[2](fn(dirty));
			if ($$scope.dirty === undefined) {
				return lets;
			}
			if (typeof lets === 'object') {
				const merged = [];
				const len = Math.max($$scope.dirty.length, lets.length);
				for (let i = 0; i < len; i += 1) {
					merged[i] = $$scope.dirty[i] | lets[i];
				}
				return merged;
			}
			return $$scope.dirty | lets;
		}
		return $$scope.dirty;
	}

	/** @returns {void} */
	function update_slot_base(
		slot,
		slot_definition,
		ctx,
		$$scope,
		slot_changes,
		get_slot_context_fn
	) {
		if (slot_changes) {
			const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
			slot.p(slot_context, slot_changes);
		}
	}

	/** @returns {any[] | -1} */
	function get_all_dirty_from_scope($$scope) {
		if ($$scope.ctx.length > 32) {
			const dirty = [];
			const length = $$scope.ctx.length / 32;
			for (let i = 0; i < length; i++) {
				dirty[i] = -1;
			}
			return dirty;
		}
		return -1;
	}

	/** @param {number | string} value
	 * @returns {[number, string]}
	 */
	function split_css_unit(value) {
		const split = typeof value === 'string' && value.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
		return split ? [parseFloat(split[1]), split[2] || 'px'] : [/** @type {number} */ (value), 'px'];
	}

	const is_client = typeof window !== 'undefined';

	/** @type {() => number} */
	let now = is_client ? () => window.performance.now() : () => Date.now();

	let raf = is_client ? (cb) => requestAnimationFrame(cb) : noop;

	const tasks = new Set();

	/**
	 * @param {number} now
	 * @returns {void}
	 */
	function run_tasks(now) {
		tasks.forEach((task) => {
			if (!task.c(now)) {
				tasks.delete(task);
				task.f();
			}
		});
		if (tasks.size !== 0) raf(run_tasks);
	}

	/**
	 * Creates a new task that runs on each raf frame
	 * until it returns a falsy value or is aborted
	 * @param {import('./private.js').TaskCallback} callback
	 * @returns {import('./private.js').Task}
	 */
	function loop(callback) {
		/** @type {import('./private.js').TaskEntry} */
		let task;
		if (tasks.size === 0) raf(run_tasks);
		return {
			promise: new Promise((fulfill) => {
				tasks.add((task = { c: callback, f: fulfill }));
			}),
			abort() {
				tasks.delete(task);
			}
		};
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append(target, node) {
		target.appendChild(node);
	}

	/**
	 * @param {Node} target
	 * @param {string} style_sheet_id
	 * @param {string} styles
	 * @returns {void}
	 */
	function append_styles(target, style_sheet_id, styles) {
		const append_styles_to = get_root_for_style(target);
		if (!append_styles_to.getElementById(style_sheet_id)) {
			const style = element('style');
			style.id = style_sheet_id;
			style.textContent = styles;
			append_stylesheet(append_styles_to, style);
		}
	}

	/**
	 * @param {Node} node
	 * @returns {ShadowRoot | Document}
	 */
	function get_root_for_style(node) {
		if (!node) return document;
		const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
		if (root && /** @type {ShadowRoot} */ (root).host) {
			return /** @type {ShadowRoot} */ (root);
		}
		return node.ownerDocument;
	}

	/**
	 * @param {Node} node
	 * @returns {CSSStyleSheet}
	 */
	function append_empty_stylesheet(node) {
		const style_element = element('style');
		// For transitions to work without 'style-src: unsafe-inline' Content Security Policy,
		// these empty tags need to be allowed with a hash as a workaround until we move to the Web Animations API.
		// Using the hash for the empty string (for an empty tag) works in all browsers except Safari.
		// So as a workaround for the workaround, when we append empty style tags we set their content to /* empty */.
		// The hash 'sha256-9OlNO0DNEeaVzHL4RZwCLsBHA8WBQ8toBp/4F5XV2nc=' will then work even in Safari.
		style_element.textContent = '/* empty */';
		append_stylesheet(get_root_for_style(node), style_element);
		return style_element.sheet;
	}

	/**
	 * @param {ShadowRoot | Document} node
	 * @param {HTMLStyleElement} style
	 * @returns {CSSStyleSheet}
	 */
	function append_stylesheet(node, style) {
		append(/** @type {Document} */ (node).head || node, style);
		return style.sheet;
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach(node) {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	/**
	 * @returns {void} */
	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	/**
	 * @template {keyof HTMLElementTagNameMap} K
	 * @param {K} name
	 * @returns {HTMLElementTagNameMap[K]}
	 */
	function element(name) {
		return document.createElement(name);
	}

	/**
	 * @template {keyof SVGElementTagNameMap} K
	 * @param {K} name
	 * @returns {SVGElement}
	 */
	function svg_element(name) {
		return document.createElementNS('http://www.w3.org/2000/svg', name);
	}

	/**
	 * @param {string} data
	 * @returns {Text}
	 */
	function text(data) {
		return document.createTextNode(data);
	}

	/**
	 * @returns {Text} */
	function space() {
		return text(' ');
	}

	/**
	 * @returns {Text} */
	function empty() {
		return text('');
	}

	/**
	 * @param {EventTarget} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @returns {() => void}
	 */
	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
	}

	/**
	 * @param {Element} element
	 * @returns {ChildNode[]}
	 */
	function children(element) {
		return Array.from(element.childNodes);
	}

	/**
	 * @returns {void} */
	function set_input_value(input, value) {
		input.value = value == null ? '' : value;
	}

	/**
	 * @returns {void} */
	function set_style(node, key, value, important) {
		{
			node.style.setProperty(key, value, '');
		}
	}

	/**
	 * @returns {void} */
	function toggle_class(element, name, toggle) {
		// The `!!` is required because an `undefined` flag means flipping the current state.
		element.classList.toggle(name, !!toggle);
	}

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @param {{ bubbles?: boolean, cancelable?: boolean }} [options]
	 * @returns {CustomEvent<T>}
	 */
	function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
		return new CustomEvent(type, { detail, bubbles, cancelable });
	}
	/** */
	class HtmlTag {
		/**
		 * @private
		 * @default false
		 */
		is_svg = false;
		/** parent for creating node */
		e = undefined;
		/** html tag nodes */
		n = undefined;
		/** target */
		t = undefined;
		/** anchor */
		a = undefined;
		constructor(is_svg = false) {
			this.is_svg = is_svg;
			this.e = this.n = null;
		}

		/**
		 * @param {string} html
		 * @returns {void}
		 */
		c(html) {
			this.h(html);
		}

		/**
		 * @param {string} html
		 * @param {HTMLElement | SVGElement} target
		 * @param {HTMLElement | SVGElement} anchor
		 * @returns {void}
		 */
		m(html, target, anchor = null) {
			if (!this.e) {
				if (this.is_svg)
					this.e = svg_element(/** @type {keyof SVGElementTagNameMap} */ (target.nodeName));
				/** #7364  target for <template> may be provided as #document-fragment(11) */ else
					this.e = element(
						/** @type {keyof HTMLElementTagNameMap} */ (
							target.nodeType === 11 ? 'TEMPLATE' : target.nodeName
						)
					);
				this.t =
					target.tagName !== 'TEMPLATE'
						? target
						: /** @type {HTMLTemplateElement} */ (target).content;
				this.c(html);
			}
			this.i(anchor);
		}

		/**
		 * @param {string} html
		 * @returns {void}
		 */
		h(html) {
			this.e.innerHTML = html;
			this.n = Array.from(
				this.e.nodeName === 'TEMPLATE' ? this.e.content.childNodes : this.e.childNodes
			);
		}

		/**
		 * @returns {void} */
		i(anchor) {
			for (let i = 0; i < this.n.length; i += 1) {
				insert(this.t, this.n[i], anchor);
			}
		}

		/**
		 * @param {string} html
		 * @returns {void}
		 */
		p(html) {
			this.d();
			this.h(html);
			this.i(this.a);
		}

		/**
		 * @returns {void} */
		d() {
			this.n.forEach(detach);
		}
	}

	/**
	 * @typedef {Node & {
	 * 	claim_order?: number;
	 * 	hydrate_init?: true;
	 * 	actual_end_child?: NodeEx;
	 * 	childNodes: NodeListOf<NodeEx>;
	 * }} NodeEx
	 */

	/** @typedef {ChildNode & NodeEx} ChildNodeEx */

	/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

	/**
	 * @typedef {ChildNodeEx[] & {
	 * 	claim_info?: {
	 * 		last_index: number;
	 * 		total_claimed: number;
	 * 	};
	 * }} ChildNodeArray
	 */

	// we need to store the information for multiple documents because a Svelte application could also contain iframes
	// https://github.com/sveltejs/svelte/issues/3624
	/** @type {Map<Document | ShadowRoot, import('./private.d.ts').StyleInformation>} */
	const managed_styles = new Map();

	let active = 0;

	// https://github.com/darkskyapp/string-hash/blob/master/index.js
	/**
	 * @param {string} str
	 * @returns {number}
	 */
	function hash(str) {
		let hash = 5381;
		let i = str.length;
		while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
		return hash >>> 0;
	}

	/**
	 * @param {Document | ShadowRoot} doc
	 * @param {Element & ElementCSSInlineStyle} node
	 * @returns {{ stylesheet: any; rules: {}; }}
	 */
	function create_style_information(doc, node) {
		const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
		managed_styles.set(doc, info);
		return info;
	}

	/**
	 * @param {Element & ElementCSSInlineStyle} node
	 * @param {number} a
	 * @param {number} b
	 * @param {number} duration
	 * @param {number} delay
	 * @param {(t: number) => number} ease
	 * @param {(t: number, u: number) => string} fn
	 * @param {number} uid
	 * @returns {string}
	 */
	function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
		const step = 16.666 / duration;
		let keyframes = '{\n';
		for (let p = 0; p <= 1; p += step) {
			const t = a + (b - a) * ease(p);
			keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
		}
		const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
		const name = `__svelte_${hash(rule)}_${uid}`;
		const doc = get_root_for_style(node);
		const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
		if (!rules[name]) {
			rules[name] = true;
			stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
		}
		const animation = node.style.animation || '';
		node.style.animation = `${
		animation ? `${animation}, ` : ''
	}${name} ${duration}ms linear ${delay}ms 1 both`;
		active += 1;
		return name;
	}

	/**
	 * @param {Element & ElementCSSInlineStyle} node
	 * @param {string} [name]
	 * @returns {void}
	 */
	function delete_rule(node, name) {
		const previous = (node.style.animation || '').split(', ');
		const next = previous.filter(
			name
				? (anim) => anim.indexOf(name) < 0 // remove specific animation
				: (anim) => anim.indexOf('__svelte') === -1 // remove all Svelte animations
		);
		const deleted = previous.length - next.length;
		if (deleted) {
			node.style.animation = next.join(', ');
			active -= deleted;
			if (!active) clear_rules();
		}
	}

	/** @returns {void} */
	function clear_rules() {
		raf(() => {
			if (active) return;
			managed_styles.forEach((info) => {
				const { ownerNode } = info.stylesheet;
				// there is no ownerNode if it runs on jsdom.
				if (ownerNode) detach(ownerNode);
			});
			managed_styles.clear();
		});
	}

	let current_component;

	/** @returns {void} */
	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error('Function called outside component initialization');
		return current_component;
	}

	/**
	 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
	 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
	 * it can be called from an external module).
	 *
	 * If a function is returned _synchronously_ from `onMount`, it will be called when the component is unmounted.
	 *
	 * `onMount` does not run inside a [server-side component](https://svelte.dev/docs#run-time-server-side-component-api).
	 *
	 * https://svelte.dev/docs/svelte#onmount
	 * @template T
	 * @param {() => import('./private.js').NotFunction<T> | Promise<import('./private.js').NotFunction<T>> | (() => any)} fn
	 * @returns {void}
	 */
	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	/**
	 * Schedules a callback to run immediately before the component is unmounted.
	 *
	 * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
	 * only one that runs inside a server-side component.
	 *
	 * https://svelte.dev/docs/svelte#ondestroy
	 * @param {() => any} fn
	 * @returns {void}
	 */
	function onDestroy(fn) {
		get_current_component().$$.on_destroy.push(fn);
	}

	/**
	 * Creates an event dispatcher that can be used to dispatch [component events](https://svelte.dev/docs#template-syntax-component-directives-on-eventname).
	 * Event dispatchers are functions that can take two arguments: `name` and `detail`.
	 *
	 * Component events created with `createEventDispatcher` create a
	 * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
	 * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
	 * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
	 * property and can contain any type of data.
	 *
	 * The event dispatcher can be typed to narrow the allowed event names and the type of the `detail` argument:
	 * ```ts
	 * const dispatch = createEventDispatcher<{
	 *  loaded: never; // does not take a detail argument
	 *  change: string; // takes a detail argument of type string, which is required
	 *  optional: number | null; // takes an optional detail argument of type number
	 * }>();
	 * ```
	 *
	 * https://svelte.dev/docs/svelte#createeventdispatcher
	 * @template {Record<string, any>} [EventMap=any]
	 * @returns {import('./public.js').EventDispatcher<EventMap>}
	 */
	function createEventDispatcher() {
		const component = get_current_component();
		return (type, detail, { cancelable = false } = {}) => {
			const callbacks = component.$$.callbacks[type];
			if (callbacks) {
				// TODO are there situations where events could be dispatched
				// in a server (non-DOM) environment?
				const event = custom_event(/** @type {string} */ (type), detail, { cancelable });
				callbacks.slice().forEach((fn) => {
					fn.call(component, event);
				});
				return !event.defaultPrevented;
			}
			return true;
		};
	}

	// TODO figure out if we still want to support
	// shorthand events, or if we want to implement
	// a real bubbling mechanism
	/**
	 * @param component
	 * @param event
	 * @returns {void}
	 */
	function bubble(component, event) {
		const callbacks = component.$$.callbacks[event.type];
		if (callbacks) {
			// @ts-ignore
			callbacks.slice().forEach((fn) => fn.call(this, event));
		}
	}

	const dirty_components = [];
	const binding_callbacks = [];

	let render_callbacks = [];

	const flush_callbacks = [];

	const resolved_promise = /* @__PURE__ */ Promise.resolve();

	let update_scheduled = false;

	/** @returns {void} */
	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	/** @returns {void} */
	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	// flush() calls callbacks in this order:
	// 1. All beforeUpdate callbacks, in order: parents before children
	// 2. All bind:this callbacks, in reverse order: children before parents.
	// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
	//    for afterUpdates called during the initial onMount, which are called in
	//    reverse order: children before parents.
	// Since callbacks might update component values, which could trigger another
	// call to flush(), the following steps guard against this:
	// 1. During beforeUpdate, any updated components will be added to the
	//    dirty_components array and will cause a reentrant call to flush(). Because
	//    the flush index is kept outside the function, the reentrant call will pick
	//    up where the earlier call left off and go through all dirty components. The
	//    current_component value is saved and restored so that the reentrant call will
	//    not interfere with the "parent" flush() call.
	// 2. bind:this callbacks cannot trigger new flush() calls.
	// 3. During afterUpdate, any updated components will NOT have their afterUpdate
	//    callback called a second time; the seen_callbacks set, outside the flush()
	//    function, guarantees this behavior.
	const seen_callbacks = new Set();

	let flushidx = 0; // Do *not* move this inside the flush() function

	/** @returns {void} */
	function flush() {
		// Do not reenter flush while dirty components are updated, as this can
		// result in an infinite loop. Instead, let the inner flush handle it.
		// Reentrancy is ok afterwards for bindings etc.
		if (flushidx !== 0) {
			return;
		}
		const saved_component = current_component;
		do {
			// first, call beforeUpdate functions
			// and update components
			try {
				while (flushidx < dirty_components.length) {
					const component = dirty_components[flushidx];
					flushidx++;
					set_current_component(component);
					update(component.$$);
				}
			} catch (e) {
				// reset dirty state to not end up in a deadlocked state and then rethrow
				dirty_components.length = 0;
				flushidx = 0;
				throw e;
			}
			set_current_component(null);
			dirty_components.length = 0;
			flushidx = 0;
			while (binding_callbacks.length) binding_callbacks.pop()();
			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			for (let i = 0; i < render_callbacks.length; i += 1) {
				const callback = render_callbacks[i];
				if (!seen_callbacks.has(callback)) {
					// ...so guard against infinite loops
					seen_callbacks.add(callback);
					callback();
				}
			}
			render_callbacks.length = 0;
		} while (dirty_components.length);
		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}
		update_scheduled = false;
		seen_callbacks.clear();
		set_current_component(saved_component);
	}

	/** @returns {void} */
	function update($$) {
		if ($$.fragment !== null) {
			$$.update();
			run_all($$.before_update);
			const dirty = $$.dirty;
			$$.dirty = [-1];
			$$.fragment && $$.fragment.p($$.ctx, dirty);
			$$.after_update.forEach(add_render_callback);
		}
	}

	/**
	 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function flush_render_callbacks(fns) {
		const filtered = [];
		const targets = [];
		render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
		targets.forEach((c) => c());
		render_callbacks = filtered;
	}

	/**
	 * @type {Promise<void> | null}
	 */
	let promise;

	/**
	 * @returns {Promise<void>}
	 */
	function wait() {
		if (!promise) {
			promise = Promise.resolve();
			promise.then(() => {
				promise = null;
			});
		}
		return promise;
	}

	/**
	 * @param {Element} node
	 * @param {INTRO | OUTRO | boolean} direction
	 * @param {'start' | 'end'} kind
	 * @returns {void}
	 */
	function dispatch(node, direction, kind) {
		node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
	}

	const outroing = new Set();

	/**
	 * @type {Outro}
	 */
	let outros;

	/**
	 * @returns {void} */
	function group_outros() {
		outros = {
			r: 0,
			c: [],
			p: outros // parent group
		};
	}

	/**
	 * @returns {void} */
	function check_outros() {
		if (!outros.r) {
			run_all(outros.c);
		}
		outros = outros.p;
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} [local]
	 * @returns {void}
	 */
	function transition_in(block, local) {
		if (block && block.i) {
			outroing.delete(block);
			block.i(local);
		}
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} local
	 * @param {0 | 1} [detach]
	 * @param {() => void} [callback]
	 * @returns {void}
	 */
	function transition_out(block, local, detach, callback) {
		if (block && block.o) {
			if (outroing.has(block)) return;
			outroing.add(block);
			outros.c.push(() => {
				outroing.delete(block);
				if (callback) {
					if (detach) block.d(1);
					callback();
				}
			});
			block.o(local);
		} else if (callback) {
			callback();
		}
	}

	/**
	 * @type {import('../transition/public.js').TransitionConfig}
	 */
	const null_transition = { duration: 0 };

	/**
	 * @param {Element & ElementCSSInlineStyle} node
	 * @param {TransitionFn} fn
	 * @param {any} params
	 * @param {boolean} intro
	 * @returns {{ run(b: 0 | 1): void; end(): void; }}
	 */
	function create_bidirectional_transition(node, fn, params, intro) {
		/**
		 * @type {TransitionOptions} */
		const options = { direction: 'both' };
		let config = fn(node, params, options);
		let t = intro ? 0 : 1;

		/**
		 * @type {Program | null} */
		let running_program = null;

		/**
		 * @type {PendingProgram | null} */
		let pending_program = null;
		let animation_name = null;

		/** @type {boolean} */
		let original_inert_value;

		/**
		 * @returns {void} */
		function clear_animation() {
			if (animation_name) delete_rule(node, animation_name);
		}

		/**
		 * @param {PendingProgram} program
		 * @param {number} duration
		 * @returns {Program}
		 */
		function init(program, duration) {
			const d = /** @type {Program['d']} */ (program.b - t);
			duration *= Math.abs(d);
			return {
				a: t,
				b: program.b,
				d,
				duration,
				start: program.start,
				end: program.start + duration,
				group: program.group
			};
		}

		/**
		 * @param {INTRO | OUTRO} b
		 * @returns {void}
		 */
		function go(b) {
			const {
				delay = 0,
				duration = 300,
				easing = identity,
				tick = noop,
				css
			} = config || null_transition;

			/**
			 * @type {PendingProgram} */
			const program = {
				start: now() + delay,
				b
			};

			if (!b) {
				// @ts-ignore todo: improve typings
				program.group = outros;
				outros.r += 1;
			}

			if ('inert' in node) {
				if (b) {
					if (original_inert_value !== undefined) {
						// aborted/reversed outro — restore previous inert value
						node.inert = original_inert_value;
					}
				} else {
					original_inert_value = /** @type {HTMLElement} */ (node).inert;
					node.inert = true;
				}
			}

			if (running_program || pending_program) {
				pending_program = program;
			} else {
				// if this is an intro, and there's a delay, we need to do
				// an initial tick and/or apply CSS animation immediately
				if (css) {
					clear_animation();
					animation_name = create_rule(node, t, b, duration, delay, easing, css);
				}
				if (b) tick(0, 1);
				running_program = init(program, duration);
				add_render_callback(() => dispatch(node, b, 'start'));
				loop((now) => {
					if (pending_program && now > pending_program.start) {
						running_program = init(pending_program, duration);
						pending_program = null;
						dispatch(node, running_program.b, 'start');
						if (css) {
							clear_animation();
							animation_name = create_rule(
								node,
								t,
								running_program.b,
								running_program.duration,
								0,
								easing,
								config.css
							);
						}
					}
					if (running_program) {
						if (now >= running_program.end) {
							tick((t = running_program.b), 1 - t);
							dispatch(node, running_program.b, 'end');
							if (!pending_program) {
								// we're done
								if (running_program.b) {
									// intro — we can tidy up immediately
									clear_animation();
								} else {
									// outro — needs to be coordinated
									if (!--running_program.group.r) run_all(running_program.group.c);
								}
							}
							running_program = null;
						} else if (now >= running_program.start) {
							const p = now - running_program.start;
							t = running_program.a + running_program.d * easing(p / running_program.duration);
							tick(t, 1 - t);
						}
					}
					return !!(running_program || pending_program);
				});
			}
		}
		return {
			run(b) {
				if (is_function(config)) {
					wait().then(() => {
						const opts = { direction: b ? 'in' : 'out' };
						// @ts-ignore
						config = config(opts);
						go(b);
					});
				} else {
					go(b);
				}
			},
			end() {
				clear_animation();
				running_program = pending_program = null;
			}
		};
	}

	/** @typedef {1} INTRO */
	/** @typedef {0} OUTRO */
	/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
	/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

	/**
	 * @typedef {Object} Outro
	 * @property {number} r
	 * @property {Function[]} c
	 * @property {Object} p
	 */

	/**
	 * @typedef {Object} PendingProgram
	 * @property {number} start
	 * @property {INTRO|OUTRO} b
	 * @property {Outro} [group]
	 */

	/**
	 * @typedef {Object} Program
	 * @property {number} a
	 * @property {INTRO|OUTRO} b
	 * @property {1|-1} d
	 * @property {number} duration
	 * @property {number} start
	 * @property {number} end
	 * @property {Outro} [group]
	 */

	// general each functions:

	function ensure_array_like(array_like_or_iterator) {
		return array_like_or_iterator?.length !== undefined
			? array_like_or_iterator
			: Array.from(array_like_or_iterator);
	}

	/** @returns {{}} */
	function get_spread_update(levels, updates) {
		const update = {};
		const to_null_out = {};
		const accounted_for = { $$scope: 1 };
		let i = levels.length;
		while (i--) {
			const o = levels[i];
			const n = updates[i];
			if (n) {
				for (const key in o) {
					if (!(key in n)) to_null_out[key] = 1;
				}
				for (const key in n) {
					if (!accounted_for[key]) {
						update[key] = n[key];
						accounted_for[key] = 1;
					}
				}
				levels[i] = n;
			} else {
				for (const key in o) {
					accounted_for[key] = 1;
				}
			}
		}
		for (const key in to_null_out) {
			if (!(key in update)) update[key] = undefined;
		}
		return update;
	}

	function get_spread_object(spread_props) {
		return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
	}

	/** @returns {void} */
	function create_component(block) {
		block && block.c();
	}

	/** @returns {void} */
	function mount_component(component, target, anchor) {
		const { fragment, after_update } = component.$$;
		fragment && fragment.m(target, anchor);
		// onMount happens before the initial afterUpdate
		add_render_callback(() => {
			const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
			// if the component was destroyed immediately
			// it will update the `$$.on_destroy` reference to `null`.
			// the destructured on_destroy may still reference to the old array
			if (component.$$.on_destroy) {
				component.$$.on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});
		after_update.forEach(add_render_callback);
	}

	/** @returns {void} */
	function destroy_component(component, detaching) {
		const $$ = component.$$;
		if ($$.fragment !== null) {
			flush_render_callbacks($$.after_update);
			run_all($$.on_destroy);
			$$.fragment && $$.fragment.d(detaching);
			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			$$.on_destroy = $$.fragment = null;
			$$.ctx = [];
		}
	}

	/** @returns {void} */
	function make_dirty(component, i) {
		if (component.$$.dirty[0] === -1) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty.fill(0);
		}
		component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
	}

	// TODO: Document the other params
	/**
	 * @param {SvelteComponent} component
	 * @param {import('./public.js').ComponentConstructorOptions} options
	 *
	 * @param {import('./utils.js')['not_equal']} not_equal Used to compare props and state values.
	 * @param {(target: Element | ShadowRoot) => void} [append_styles] Function that appends styles to the DOM when the component is first initialised.
	 * This will be the `add_css` function from the compiled component.
	 *
	 * @returns {void}
	 */
	function init(
		component,
		options,
		instance,
		create_fragment,
		not_equal,
		props,
		append_styles = null,
		dirty = [-1]
	) {
		const parent_component = current_component;
		set_current_component(component);
		/** @type {import('./private.js').T$$} */
		const $$ = (component.$$ = {
			fragment: null,
			ctx: [],
			// state
			props,
			update: noop,
			not_equal,
			bound: blank_object(),
			// lifecycle
			on_mount: [],
			on_destroy: [],
			on_disconnect: [],
			before_update: [],
			after_update: [],
			context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
			// everything else
			callbacks: blank_object(),
			dirty,
			skip_bound: false,
			root: options.target || parent_component.$$.root
		});
		append_styles && append_styles($$.root);
		let ready = false;
		$$.ctx = instance
			? instance(component, options.props || {}, (i, ret, ...rest) => {
					const value = rest.length ? rest[0] : ret;
					if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
						if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
						if (ready) make_dirty(component, i);
					}
					return ret;
			  })
			: [];
		$$.update();
		ready = true;
		run_all($$.before_update);
		// `false` as a special case of no DOM component
		$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
		if (options.target) {
			if (options.hydrate) {
				// TODO: what is the correct type here?
				// @ts-expect-error
				const nodes = children(options.target);
				$$.fragment && $$.fragment.l(nodes);
				nodes.forEach(detach);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				$$.fragment && $$.fragment.c();
			}
			if (options.intro) transition_in(component.$$.fragment);
			mount_component(component, options.target, options.anchor);
			flush();
		}
		set_current_component(parent_component);
	}

	/**
	 * Base class for Svelte components. Used when dev=false.
	 *
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 */
	class SvelteComponent {
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$ = undefined;
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$set = undefined;

		/** @returns {void} */
		$destroy() {
			destroy_component(this, 1);
			this.$destroy = noop;
		}

		/**
		 * @template {Extract<keyof Events, string>} K
		 * @param {K} type
		 * @param {((e: Events[K]) => void) | null | undefined} callback
		 * @returns {() => void}
		 */
		$on(type, callback) {
			if (!is_function(callback)) {
				return noop;
			}
			const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
			callbacks.push(callback);
			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		/**
		 * @param {Partial<Props>} props
		 * @returns {void}
		 */
		$set(props) {
			if (this.$$set && !is_empty(props)) {
				this.$$.skip_bound = true;
				this.$$set(props);
				this.$$.skip_bound = false;
			}
		}
	}

	/**
	 * @typedef {Object} CustomElementPropDefinition
	 * @property {string} [attribute]
	 * @property {boolean} [reflect]
	 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
	 */

	// generated during release, do not modify

	/**
	 * The current version, as set in package.json.
	 *
	 * https://svelte.dev/docs/svelte-compiler#svelte-version
	 * @type {string}
	 */
	const VERSION = '4.2.17';
	const PUBLIC_VERSION = '4';

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @returns {void}
	 */
	function dispatch_dev(type, detail) {
		document.dispatchEvent(custom_event(type, { version: VERSION, ...detail }, { bubbles: true }));
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append_dev(target, node) {
		dispatch_dev('SvelteDOMInsert', { target, node });
		append(target, node);
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert_dev(target, node, anchor) {
		dispatch_dev('SvelteDOMInsert', { target, node, anchor });
		insert(target, node, anchor);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach_dev(node) {
		dispatch_dev('SvelteDOMRemove', { node });
		detach(node);
	}

	/**
	 * @param {Node} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @param {boolean} [has_prevent_default]
	 * @param {boolean} [has_stop_propagation]
	 * @param {boolean} [has_stop_immediate_propagation]
	 * @returns {() => void}
	 */
	function listen_dev(
		node,
		event,
		handler,
		options,
		has_prevent_default,
		has_stop_propagation,
		has_stop_immediate_propagation
	) {
		const modifiers =
			options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
		if (has_prevent_default) modifiers.push('preventDefault');
		if (has_stop_propagation) modifiers.push('stopPropagation');
		if (has_stop_immediate_propagation) modifiers.push('stopImmediatePropagation');
		dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
		const dispose = listen(node, event, handler, options);
		return () => {
			dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
			dispose();
		};
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr_dev(node, attribute, value) {
		attr(node, attribute, value);
		if (value == null) dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
		else dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
	}

	/**
	 * @param {Element} node
	 * @param {string} property
	 * @param {any} [value]
	 * @returns {void}
	 */
	function prop_dev(node, property, value) {
		node[property] = value;
		dispatch_dev('SvelteDOMSetProperty', { node, property, value });
	}

	/**
	 * @param {Text} text
	 * @param {unknown} data
	 * @returns {void}
	 */
	function set_data_dev(text, data) {
		data = '' + data;
		if (text.data === data) return;
		dispatch_dev('SvelteDOMSetData', { node: text, data });
		text.data = /** @type {string} */ (data);
	}

	function ensure_array_like_dev(arg) {
		if (
			typeof arg !== 'string' &&
			!(arg && typeof arg === 'object' && 'length' in arg) &&
			!(typeof Symbol === 'function' && arg && Symbol.iterator in arg)
		) {
			throw new Error('{#each} only works with iterable values.');
		}
		return ensure_array_like(arg);
	}

	/**
	 * @returns {void} */
	function validate_slots(name, slot, keys) {
		for (const slot_key of Object.keys(slot)) {
			if (!~keys.indexOf(slot_key)) {
				console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
			}
		}
	}

	/**
	 * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
	 *
	 * Can be used to create strongly typed Svelte components.
	 *
	 * #### Example:
	 *
	 * You have component library on npm called `component-library`, from which
	 * you export a component called `MyComponent`. For Svelte+TypeScript users,
	 * you want to provide typings. Therefore you create a `index.d.ts`:
	 * ```ts
	 * import { SvelteComponent } from "svelte";
	 * export class MyComponent extends SvelteComponent<{foo: string}> {}
	 * ```
	 * Typing this makes it possible for IDEs like VS Code with the Svelte extension
	 * to provide intellisense and to use the component like this in a Svelte file
	 * with TypeScript:
	 * ```svelte
	 * <script lang="ts">
	 * 	import { MyComponent } from "component-library";
	 * </script>
	 * <MyComponent foo={'bar'} />
	 * ```
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 * @template {Record<string, any>} [Slots=any]
	 * @extends {SvelteComponent<Props, Events>}
	 */
	class SvelteComponentDev extends SvelteComponent {
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Props}
		 */
		$$prop_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Events}
		 */
		$$events_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Slots}
		 */
		$$slot_def;

		/** @param {import('./public.js').ComponentConstructorOptions<Props>} options */
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error("'target' is a required option");
			}
			super();
		}

		/** @returns {void} */
		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn('Component was already destroyed'); // eslint-disable-line no-console
			};
		}

		/** @returns {void} */
		$capture_state() {}

		/** @returns {void} */
		$inject_state() {}
	}

	if (typeof window !== 'undefined')
		// @ts-ignore
		(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

	const subscriber_queue = [];

	/**
	 * Creates a `Readable` store that allows reading by subscription.
	 *
	 * https://svelte.dev/docs/svelte-store#readable
	 * @template T
	 * @param {T} [value] initial value
	 * @param {import('./public.js').StartStopNotifier<T>} [start]
	 * @returns {import('./public.js').Readable<T>}
	 */
	function readable(value, start) {
		return {
			subscribe: writable(value, start).subscribe
		};
	}

	/**
	 * Create a `Writable` store that allows both updating and reading by subscription.
	 *
	 * https://svelte.dev/docs/svelte-store#writable
	 * @template T
	 * @param {T} [value] initial value
	 * @param {import('./public.js').StartStopNotifier<T>} [start]
	 * @returns {import('./public.js').Writable<T>}
	 */
	function writable(value, start = noop) {
		/** @type {import('./public.js').Unsubscriber} */
		let stop;
		/** @type {Set<import('./private.js').SubscribeInvalidateTuple<T>>} */
		const subscribers = new Set();
		/** @param {T} new_value
		 * @returns {void}
		 */
		function set(new_value) {
			if (safe_not_equal(value, new_value)) {
				value = new_value;
				if (stop) {
					// store is ready
					const run_queue = !subscriber_queue.length;
					for (const subscriber of subscribers) {
						subscriber[1]();
						subscriber_queue.push(subscriber, value);
					}
					if (run_queue) {
						for (let i = 0; i < subscriber_queue.length; i += 2) {
							subscriber_queue[i][0](subscriber_queue[i + 1]);
						}
						subscriber_queue.length = 0;
					}
				}
			}
		}

		/**
		 * @param {import('./public.js').Updater<T>} fn
		 * @returns {void}
		 */
		function update(fn) {
			set(fn(value));
		}

		/**
		 * @param {import('./public.js').Subscriber<T>} run
		 * @param {import('./private.js').Invalidator<T>} [invalidate]
		 * @returns {import('./public.js').Unsubscriber}
		 */
		function subscribe(run, invalidate = noop) {
			/** @type {import('./private.js').SubscribeInvalidateTuple<T>} */
			const subscriber = [run, invalidate];
			subscribers.add(subscriber);
			if (subscribers.size === 1) {
				stop = start(set, update) || noop;
			}
			run(value);
			return () => {
				subscribers.delete(subscriber);
				if (subscribers.size === 0 && stop) {
					stop();
					stop = null;
				}
			};
		}
		return { set, update, subscribe };
	}

	/**
	 * Derived value store by synchronizing one or more readable stores and
	 * applying an aggregation function over its input values.
	 *
	 * https://svelte.dev/docs/svelte-store#derived
	 * @template {import('./private.js').Stores} S
	 * @template T
	 * @overload
	 * @param {S} stores - input stores
	 * @param {(values: import('./private.js').StoresValues<S>, set: (value: T) => void, update: (fn: import('./public.js').Updater<T>) => void) => import('./public.js').Unsubscriber | void} fn - function callback that aggregates the values
	 * @param {T} [initial_value] - initial value
	 * @returns {import('./public.js').Readable<T>}
	 */

	/**
	 * Derived value store by synchronizing one or more readable stores and
	 * applying an aggregation function over its input values.
	 *
	 * https://svelte.dev/docs/svelte-store#derived
	 * @template {import('./private.js').Stores} S
	 * @template T
	 * @overload
	 * @param {S} stores - input stores
	 * @param {(values: import('./private.js').StoresValues<S>) => T} fn - function callback that aggregates the values
	 * @param {T} [initial_value] - initial value
	 * @returns {import('./public.js').Readable<T>}
	 */

	/**
	 * @template {import('./private.js').Stores} S
	 * @template T
	 * @param {S} stores
	 * @param {Function} fn
	 * @param {T} [initial_value]
	 * @returns {import('./public.js').Readable<T>}
	 */
	function derived(stores, fn, initial_value) {
		const single = !Array.isArray(stores);
		/** @type {Array<import('./public.js').Readable<any>>} */
		const stores_array = single ? [stores] : stores;
		if (!stores_array.every(Boolean)) {
			throw new Error('derived() expects stores as input, got a falsy value');
		}
		const auto = fn.length < 2;
		return readable(initial_value, (set, update) => {
			let started = false;
			const values = [];
			let pending = 0;
			let cleanup = noop;
			const sync = () => {
				if (pending) {
					return;
				}
				cleanup();
				const result = fn(single ? values[0] : values, set, update);
				if (auto) {
					set(result);
				} else {
					cleanup = is_function(result) ? result : noop;
				}
			};
			const unsubscribers = stores_array.map((store, i) =>
				subscribe(
					store,
					(value) => {
						values[i] = value;
						pending &= ~(1 << i);
						if (started) {
							sync();
						}
					},
					() => {
						pending |= 1 << i;
					}
				)
			);
			started = true;
			sync();
			return function stop() {
				run_all(unsubscribers);
				cleanup();
				// We need to set this to false because callbacks can still happen despite having unsubscribed:
				// Callbacks might already be placed in the queue which doesn't know it should no longer
				// invoke this derived store.
				started = false;
			};
		});
	}

	const time = readable(new Date(), (set) => {
	  const interval = setInterval(() => {
	    set(new Date());
	  }, 1000);

	  return () => {
	    clearInterval(interval);
	  }
	});

	let start = new Date();

	const userActivity = () => {
	  start = new Date();
	};

	const elapsed = derived(time, ($time) =>
	  Math.round(($time - start) / 1000)
	);

	/* src/components/Headline.svelte generated by Svelte v4.2.17 */
	const file$e = "src/components/Headline.svelte";

	function add_css$d(target) {
		append_styles(target, "svelte-1pe6e7k", "h1.svelte-1pe6e7k.svelte-1pe6e7k{font-size:24pt}h1.svelte-1pe6e7k>small.svelte-1pe6e7k{font-size:12pt;color:#bbb}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSGVhZGxpbmUuc3ZlbHRlIiwic291cmNlcyI6WyJIZWFkbGluZS5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgZXhwb3J0IGxldCBtZXNzYWdlID0gJydcbiAgZXhwb3J0IGxldCBpdGVtSWQgPSAnJ1xuPC9zY3JpcHQ+XG5cbjxoMT5cbiAge21lc3NhZ2V9XG4gIHsjaWYgaXRlbUlkfVxuICAgIDxzbWFsbD57aXRlbUlkfTwvc21hbGw+XG4gIHsvaWZ9XG48L2gxPlxuXG48c3R5bGU+XG4gIGgxIHtcbiAgICBmb250LXNpemU6IDI0cHQ7XG4gIH1cbiAgaDEgPiBzbWFsbCB7XG4gICAgZm9udC1zaXplOiAxMnB0O1xuICAgIGNvbG9yOiAjYmJiO1xuICB9XG48L3N0eWxlPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWFFLGdDQUFHLENBQ0QsU0FBUyxDQUFFLElBQ2IsQ0FDQSxpQkFBRSxDQUFHLG9CQUFNLENBQ1QsU0FBUyxDQUFFLElBQUksQ0FDZixLQUFLLENBQUUsSUFDVCJ9 */");
	}

	// (8:2) {#if itemId}
	function create_if_block$7(ctx) {
		let small;
		let t;

		const block = {
			c: function create() {
				small = element("small");
				t = text(/*itemId*/ ctx[1]);
				attr_dev(small, "class", "svelte-1pe6e7k");
				add_location(small, file$e, 8, 4, 107);
			},
			m: function mount(target, anchor) {
				insert_dev(target, small, anchor);
				append_dev(small, t);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*itemId*/ 2) set_data_dev(t, /*itemId*/ ctx[1]);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(small);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$7.name,
			type: "if",
			source: "(8:2) {#if itemId}",
			ctx
		});

		return block;
	}

	function create_fragment$e(ctx) {
		let h1;
		let t0;
		let t1;
		let if_block = /*itemId*/ ctx[1] && create_if_block$7(ctx);

		const block = {
			c: function create() {
				h1 = element("h1");
				t0 = text(/*message*/ ctx[0]);
				t1 = space();
				if (if_block) if_block.c();
				attr_dev(h1, "class", "svelte-1pe6e7k");
				add_location(h1, file$e, 5, 0, 71);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, h1, anchor);
				append_dev(h1, t0);
				append_dev(h1, t1);
				if (if_block) if_block.m(h1, null);
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*message*/ 1) set_data_dev(t0, /*message*/ ctx[0]);

				if (/*itemId*/ ctx[1]) {
					if (if_block) {
						if_block.p(ctx, dirty);
					} else {
						if_block = create_if_block$7(ctx);
						if_block.c();
						if_block.m(h1, null);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(h1);
				}

				if (if_block) if_block.d();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$e.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$e($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Headline', slots, []);
		let { message = '' } = $$props;
		let { itemId = '' } = $$props;
		const writable_props = ['message', 'itemId'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Headline> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('message' in $$props) $$invalidate(0, message = $$props.message);
			if ('itemId' in $$props) $$invalidate(1, itemId = $$props.itemId);
		};

		$$self.$capture_state = () => ({ message, itemId });

		$$self.$inject_state = $$props => {
			if ('message' in $$props) $$invalidate(0, message = $$props.message);
			if ('itemId' in $$props) $$invalidate(1, itemId = $$props.itemId);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [message, itemId];
	}

	class Headline extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$e, create_fragment$e, safe_not_equal, { message: 0, itemId: 1 }, add_css$d);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Headline",
				options,
				id: create_fragment$e.name
			});
		}

		get message() {
			throw new Error("<Headline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set message(value) {
			throw new Error("<Headline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get itemId() {
			throw new Error("<Headline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set itemId(value) {
			throw new Error("<Headline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/ListItem.svelte generated by Svelte v4.2.17 */
	const file$d = "src/components/ListItem.svelte";

	function add_css$c(target) {
		append_styles(target, "svelte-1uc8yr0", "li.svelte-1uc8yr0{border:1px solid #ddd;border-radius:3px 3px 3px 3px;margin-bottom:3px;padding:9px;font-size:12pt;cursor:pointer}.active.svelte-1uc8yr0{background-color:#bbb}li.svelte-1uc8yr0:hover{border:1px solid #aaa}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGlzdEl0ZW0uc3ZlbHRlIiwic291cmNlcyI6WyJMaXN0SXRlbS5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IHsgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJ1xuXG4gIGV4cG9ydCBsZXQgaXRlbSA9IHsgaWQ6IDAsIG5hbWU6ICcnLCB1cmw6ICcnIH1cbiAgZXhwb3J0IGxldCBjdXJyZW50SXRlbSA9IDBcblxuICBjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpXG5cbiAgY29uc3Qgc2VsZWN0ID0gKCkgPT4gZGlzcGF0Y2goJ3NlbGVjdCcsIHsgaXRlbTogaXRlbSB9KVxuICBjb25zdCBlZGl0ID0gKCkgPT4gZGlzcGF0Y2goJ2VkaXQnLCB7IGl0ZW06IGl0ZW0gfSlcbjwvc2NyaXB0PlxuXG48bGkgY2xhc3M6YWN0aXZlPXtjdXJyZW50SXRlbSA9PT0gaXRlbS5pZH0+XG4gIDxkaXYgc3R5bGU9XCJmbG9hdDpyaWdodDtcIj5cbiAgICA8YnV0dHRvblxuICAgICAgb246a2V5ZG93bj17ZWRpdChpdGVtKX1cbiAgICAgIG9uOmNsaWNrPXtlZGl0KGl0ZW0pfVxuICAgICAgcm9sZT1cImJ1dHRvblwiXG4gICAgICB0YWJpbmRleD1cIjBcIj5FZGl0PC9idXR0dG9uXG4gICAgPlxuICA8L2Rpdj5cbiAgPGRpdlxuICAgIG9uOmtleWRvd249e3NlbGVjdChpdGVtKX1cbiAgICBvbjpjbGljaz17c2VsZWN0KGl0ZW0pfVxuICAgIHJvbGU9XCJidXR0b25cIlxuICAgIHRhYmluZGV4PVwiMFwiXG4gID5cbiAgICB7aXRlbS5uYW1lfSAtXG4gICAgPHNtYWxsPntpdGVtLnVybH08L3NtYWxsPlxuICA8L2Rpdj5cbjwvbGk+XG5cbjxzdHlsZT5cbiAgbGkge1xuICAgIGJvcmRlcjogMXB4IHNvbGlkICNkZGQ7XG4gICAgYm9yZGVyLXJhZGl1czogM3B4IDNweCAzcHggM3B4O1xuICAgIG1hcmdpbi1ib3R0b206IDNweDtcbiAgICBwYWRkaW5nOiA5cHg7XG4gICAgZm9udC1zaXplOiAxMnB0O1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgfVxuICAuYWN0aXZlIHtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjYmJiO1xuICB9XG4gIGxpOmhvdmVyIHtcbiAgICBib3JkZXI6IDFweCBzb2xpZCAjYWFhO1xuICB9XG48L3N0eWxlPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWlDRSxpQkFBRyxDQUNELE1BQU0sQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FDdEIsYUFBYSxDQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FDOUIsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsT0FBTyxDQUFFLEdBQUcsQ0FDWixTQUFTLENBQUUsSUFBSSxDQUNmLE1BQU0sQ0FBRSxPQUNWLENBQ0Esc0JBQVEsQ0FDTixnQkFBZ0IsQ0FBRSxJQUNwQixDQUNBLGlCQUFFLE1BQU8sQ0FDUCxNQUFNLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUNwQiJ9 */");
	}

	function create_fragment$d(ctx) {
		let li;
		let div0;
		let buttton;
		let t1;
		let div1;
		let t2_value = /*item*/ ctx[0].name + "";
		let t2;
		let t3;
		let small;
		let t4_value = /*item*/ ctx[0].url + "";
		let t4;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				li = element("li");
				div0 = element("div");
				buttton = element("buttton");
				buttton.textContent = "Edit";
				t1 = space();
				div1 = element("div");
				t2 = text(t2_value);
				t3 = text(" -\n    ");
				small = element("small");
				t4 = text(t4_value);
				attr_dev(buttton, "role", "button");
				attr_dev(buttton, "tabindex", "0");
				add_location(buttton, file$d, 14, 4, 382);
				set_style(div0, "float", "right");
				add_location(div0, file$d, 13, 2, 351);
				add_location(small, file$d, 28, 4, 643);
				attr_dev(div1, "role", "button");
				attr_dev(div1, "tabindex", "0");
				add_location(div1, file$d, 21, 2, 519);
				attr_dev(li, "class", "svelte-1uc8yr0");
				toggle_class(li, "active", /*currentItem*/ ctx[1] === /*item*/ ctx[0].id);
				add_location(li, file$d, 12, 0, 305);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, li, anchor);
				append_dev(li, div0);
				append_dev(div0, buttton);
				append_dev(li, t1);
				append_dev(li, div1);
				append_dev(div1, t2);
				append_dev(div1, t3);
				append_dev(div1, small);
				append_dev(small, t4);

				if (!mounted) {
					dispose = [
						listen_dev(
							buttton,
							"keydown",
							function () {
								if (is_function(/*edit*/ ctx[3](/*item*/ ctx[0]))) /*edit*/ ctx[3](/*item*/ ctx[0]).apply(this, arguments);
							},
							false,
							false,
							false,
							false
						),
						listen_dev(
							buttton,
							"click",
							function () {
								if (is_function(/*edit*/ ctx[3](/*item*/ ctx[0]))) /*edit*/ ctx[3](/*item*/ ctx[0]).apply(this, arguments);
							},
							false,
							false,
							false,
							false
						),
						listen_dev(
							div1,
							"keydown",
							function () {
								if (is_function(/*select*/ ctx[2](/*item*/ ctx[0]))) /*select*/ ctx[2](/*item*/ ctx[0]).apply(this, arguments);
							},
							false,
							false,
							false,
							false
						),
						listen_dev(
							div1,
							"click",
							function () {
								if (is_function(/*select*/ ctx[2](/*item*/ ctx[0]))) /*select*/ ctx[2](/*item*/ ctx[0]).apply(this, arguments);
							},
							false,
							false,
							false,
							false
						)
					];

					mounted = true;
				}
			},
			p: function update(new_ctx, [dirty]) {
				ctx = new_ctx;
				if (dirty & /*item*/ 1 && t2_value !== (t2_value = /*item*/ ctx[0].name + "")) set_data_dev(t2, t2_value);
				if (dirty & /*item*/ 1 && t4_value !== (t4_value = /*item*/ ctx[0].url + "")) set_data_dev(t4, t4_value);

				if (dirty & /*currentItem, item*/ 3) {
					toggle_class(li, "active", /*currentItem*/ ctx[1] === /*item*/ ctx[0].id);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(li);
				}

				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$d.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$d($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('ListItem', slots, []);
		let { item = { id: 0, name: '', url: '' } } = $$props;
		let { currentItem = 0 } = $$props;
		const dispatch = createEventDispatcher();
		const select = () => dispatch('select', { item });
		const edit = () => dispatch('edit', { item });
		const writable_props = ['item', 'currentItem'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ListItem> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('item' in $$props) $$invalidate(0, item = $$props.item);
			if ('currentItem' in $$props) $$invalidate(1, currentItem = $$props.currentItem);
		};

		$$self.$capture_state = () => ({
			createEventDispatcher,
			item,
			currentItem,
			dispatch,
			select,
			edit
		});

		$$self.$inject_state = $$props => {
			if ('item' in $$props) $$invalidate(0, item = $$props.item);
			if ('currentItem' in $$props) $$invalidate(1, currentItem = $$props.currentItem);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [item, currentItem, select, edit];
	}

	class ListItem extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$d, create_fragment$d, safe_not_equal, { item: 0, currentItem: 1 }, add_css$c);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "ListItem",
				options,
				id: create_fragment$d.name
			});
		}

		get item() {
			throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set item(value) {
			throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get currentItem() {
			throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set currentItem(value) {
			throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/List.svelte generated by Svelte v4.2.17 */
	const file$c = "src/components/List.svelte";

	function add_css$b(target) {
		append_styles(target, "svelte-xl8b5k", "ul.svelte-xl8b5k{list-style:none;margin:0px;padding:0px}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGlzdC5zdmVsdGUiLCJzb3VyY2VzIjpbIkxpc3Quc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJ3N2ZWx0ZSdcbiAgaW1wb3J0IExpc3RJdGVtIGZyb20gJy4vTGlzdEl0ZW0uc3ZlbHRlJ1xuXG4gIGV4cG9ydCBsZXQgbGlzdCA9IFtdXG4gIGV4cG9ydCBsZXQgY3VycmVudEl0ZW0gPSAwXG5cbiAgY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKVxuXG4gIGNvbnN0IHNlbGVjdCA9IChldmVudCkgPT4ge1xuICAgIGN1cnJlbnRJdGVtID0gZXZlbnQuZGV0YWlsLml0ZW0uaWRcbiAgICBkaXNwYXRjaCgnc2VsZWN0JywgZXZlbnQuZGV0YWlsKVxuICB9XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cImxpc3QtY29udGFpbmVyXCI+XG4gIDx1bD5cbiAgICB7I2VhY2ggbGlzdCBhcyBpdGVtfVxuICAgICAgPExpc3RJdGVtIHtjdXJyZW50SXRlbX0ge2l0ZW19IG9uOnNlbGVjdD17c2VsZWN0fSBvbjplZGl0IC8+XG4gICAgey9lYWNofVxuICA8L3VsPlxuPC9kaXY+XG5cbjxzdHlsZT5cbiAgdWwge1xuICAgIGxpc3Qtc3R5bGU6IG5vbmU7XG4gICAgbWFyZ2luOiAwcHg7XG4gICAgcGFkZGluZzogMHB4O1xuICB9XG48L3N0eWxlPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXdCRSxnQkFBRyxDQUNELFVBQVUsQ0FBRSxJQUFJLENBQ2hCLE1BQU0sQ0FBRSxHQUFHLENBQ1gsT0FBTyxDQUFFLEdBQ1gifQ== */");
	}

	function get_each_context$2(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[5] = list[i];
		return child_ctx;
	}

	// (18:4) {#each list as item}
	function create_each_block$2(ctx) {
		let listitem;
		let current;

		listitem = new ListItem({
				props: {
					currentItem: /*currentItem*/ ctx[0],
					item: /*item*/ ctx[5]
				},
				$$inline: true
			});

		listitem.$on("select", /*select*/ ctx[2]);
		listitem.$on("edit", /*edit_handler*/ ctx[3]);

		const block = {
			c: function create() {
				create_component(listitem.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(listitem, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const listitem_changes = {};
				if (dirty & /*currentItem*/ 1) listitem_changes.currentItem = /*currentItem*/ ctx[0];
				if (dirty & /*list*/ 2) listitem_changes.item = /*item*/ ctx[5];
				listitem.$set(listitem_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(listitem.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(listitem.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(listitem, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$2.name,
			type: "each",
			source: "(18:4) {#each list as item}",
			ctx
		});

		return block;
	}

	function create_fragment$c(ctx) {
		let div;
		let ul;
		let current;
		let each_value = ensure_array_like_dev(/*list*/ ctx[1]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		const block = {
			c: function create() {
				div = element("div");
				ul = element("ul");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr_dev(ul, "class", "svelte-xl8b5k");
				add_location(ul, file$c, 16, 2, 351);
				attr_dev(div, "class", "list-container");
				add_location(div, file$c, 15, 0, 320);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, ul);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(ul, null);
					}
				}

				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*currentItem, list, select*/ 7) {
					each_value = ensure_array_like_dev(/*list*/ ctx[1]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$2(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block$2(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(ul, null);
						}
					}

					group_outros();

					for (i = each_value.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;

				for (let i = 0; i < each_value.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o: function outro(local) {
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$c.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$c($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('List', slots, []);
		let { list = [] } = $$props;
		let { currentItem = 0 } = $$props;
		const dispatch = createEventDispatcher();

		const select = event => {
			$$invalidate(0, currentItem = event.detail.item.id);
			dispatch('select', event.detail);
		};

		const writable_props = ['list', 'currentItem'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<List> was created with unknown prop '${key}'`);
		});

		function edit_handler(event) {
			bubble.call(this, $$self, event);
		}

		$$self.$$set = $$props => {
			if ('list' in $$props) $$invalidate(1, list = $$props.list);
			if ('currentItem' in $$props) $$invalidate(0, currentItem = $$props.currentItem);
		};

		$$self.$capture_state = () => ({
			createEventDispatcher,
			ListItem,
			list,
			currentItem,
			dispatch,
			select
		});

		$$self.$inject_state = $$props => {
			if ('list' in $$props) $$invalidate(1, list = $$props.list);
			if ('currentItem' in $$props) $$invalidate(0, currentItem = $$props.currentItem);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [currentItem, list, select, edit_handler];
	}

	class List extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$c, create_fragment$c, safe_not_equal, { list: 1, currentItem: 0 }, add_css$b);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "List",
				options,
				id: create_fragment$c.name
			});
		}

		get list() {
			throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set list(value) {
			throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get currentItem() {
			throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set currentItem(value) {
			throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/Table.svelte generated by Svelte v4.2.17 */
	const file$b = "src/components/Table.svelte";

	function add_css$a(target) {
		append_styles(target, "svelte-17ptexh", ".tbl.svelte-17ptexh.svelte-17ptexh{border-collapse:collapse;border-spacing:0;border-radius:3px;margin-bottom:5px;width:100%}tr.svelte-17ptexh:hover td.svelte-17ptexh{background:#ddd;cursor:pointer}th.svelte-17ptexh.svelte-17ptexh{background:#999;color:white;font-weight:bold;cursor:pointer}th.svelte-17ptexh.svelte-17ptexh,td.svelte-17ptexh.svelte-17ptexh{padding:10px;text-align:left}tr.active.svelte-17ptexh td.svelte-17ptexh{color:green}tr.svelte-17ptexh.svelte-17ptexh:first-child{border-top:1px solid #bbb}tr.svelte-17ptexh.svelte-17ptexh:last-child{border-bottom:1px solid #bbb}th.svelte-17ptexh.svelte-17ptexh:first-child{border-left:1px solid #bbb}th.svelte-17ptexh.svelte-17ptexh:last-child{border-right:1px solid #bbb}tbody.svelte-17ptexh tr.svelte-17ptexh:nth-child(odd){background:#eee}td.svelte-17ptexh.svelte-17ptexh:first-child{border-left:1px solid #bbb}td.svelte-17ptexh.svelte-17ptexh:last-child{border-right:1px solid #bbb}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGFibGUuc3ZlbHRlIiwic291cmNlcyI6WyJUYWJsZS5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IHsgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJ1xuXG4gIGV4cG9ydCBsZXQgZGF0YSA9IHtcbiAgICBoZWFkZXI6IFtdLFxuICAgIGVudHJpZXM6IFtdLFxuICB9XG4gIGV4cG9ydCBsZXQgc2VsZWN0ZWQgPSAnJ1xuXG4gIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKClcblxuICBjb25zdCBoYW5kbGVDbGljayA9IChlbnRyeSkgPT4gZGlzcGF0Y2goJ2NsaWNrZWRSb3cnLCBlbnRyeSlcblxuICBjb25zdCB0YmxIZWFkQ2xpY2sgPSAoZSkgPT4ge1xuICAgIGlmIChlLnRhcmdldC50YWdOYW1lICE9ICdUSCcpIHJldHVyblxuICAgIGxldCB0aCA9IGUudGFyZ2V0XG4gICAgc29ydFRhYmxlKHRoLmNlbGxJbmRleCwgdGguZGF0YXNldC50eXBlLCB0aC5kYXRhc2V0Lm9yZGVyKVxuICAgIGlmICh0aC5kYXRhc2V0Lm9yZGVyID09PSAnYXNjJykge1xuICAgICAgdGguZGF0YXNldC5vcmRlciA9ICdkZXNjJ1xuICAgIH0gZWxzZSB7XG4gICAgICB0aC5kYXRhc2V0Lm9yZGVyID0gJ2FzYydcbiAgICB9XG4gIH1cblxuICBjb25zdCBzb3J0VGFibGUgPSAoY29sTnVtLCB0eXBlLCBvcmRlcikgPT4ge1xuICAgIGxldCB0Ym9keSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3Rib2R5JylcbiAgICBsZXQgcm93c0FycmF5ID0gQXJyYXkuZnJvbSh0Ym9keS5yb3dzKVxuICAgIGxldCBjb21wYXJlXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdkYXRlJzpcbiAgICAgICAgY29tcGFyZSA9IChyb3dBLCByb3dCKSA9PiB7XG4gICAgICAgICAgY29uc3QgZGF0ZUEgPSBEYXRlLnBhcnNlKHJvd0EuY2VsbHNbY29sTnVtXS5pbm5lckhUTUwpXG4gICAgICAgICAgY29uc3QgZGF0ZUIgPSBEYXRlLnBhcnNlKHJvd0IuY2VsbHNbY29sTnVtXS5pbm5lckhUTUwpXG4gICAgICAgICAgcmV0dXJuIHJvd0EuY2VsbHNbY29sTnVtXS5pbm5lckhUTUwgLSByb3dCLmNlbGxzW2NvbE51bV0uaW5uZXJIVE1MXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgIGNvbXBhcmUgPSAocm93QSwgcm93QikgPT4ge1xuICAgICAgICAgIHJldHVybiByb3dBLmNlbGxzW2NvbE51bV0uaW5uZXJIVE1MIC0gcm93Qi5jZWxsc1tjb2xOdW1dLmlubmVySFRNTFxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICBjb21wYXJlID0gKHJvd0EsIHJvd0IpID0+IHtcbiAgICAgICAgICByZXR1cm4gcm93QS5jZWxsc1tjb2xOdW1dLmlubmVySFRNTCA+IHJvd0IuY2VsbHNbY29sTnVtXS5pbm5lckhUTUxcbiAgICAgICAgICAgID8gMVxuICAgICAgICAgICAgOiAtMVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgfVxuICAgIHJvd3NBcnJheS5zb3J0KGNvbXBhcmUpXG4gICAgaWYgKG9yZGVyID09PSAnZGVzYycpIHtcbiAgICAgIHJvd3NBcnJheS5yZXZlcnNlKClcbiAgICB9XG4gICAgdGJvZHkuYXBwZW5kKC4uLnJvd3NBcnJheSlcbiAgfVxuPC9zY3JpcHQ+XG5cbjx0YWJsZSBjbGFzcz1cInRibFwiPlxuICA8dGhlYWQ+XG4gICAgPHRyPlxuICAgICAgeyNlYWNoIGRhdGEuaGVhZGVyIGFzIGhlYWRlcn1cbiAgICAgICAgPHRoIGRhdGEtdHlwZT17aGVhZGVyLnR5cGV9IGRhdGEtb3JkZXI9XCJhc2NcIiBvbjpjbGljaz17dGJsSGVhZENsaWNrfVxuICAgICAgICAgID57aGVhZGVyLnZhbHVlfTwvdGhcbiAgICAgICAgPlxuICAgICAgey9lYWNofVxuICAgIDwvdHI+XG4gIDwvdGhlYWQ+XG4gIDx0Ym9keT5cbiAgICB7I2VhY2ggZGF0YS5lbnRyaWVzIGFzIGVudHJ5fVxuICAgICAgPHRyIGNsYXNzOmFjdGl2ZT17c2VsZWN0ZWQgPT09IGVudHJ5Lm5hbWV9IG9uOmNsaWNrPXtoYW5kbGVDbGljayhlbnRyeSl9PlxuICAgICAgICA8dGQ+e2VudHJ5LmlkfTwvdGQ+XG4gICAgICAgIDx0ZD57ZW50cnkubmFtZX08L3RkPlxuICAgICAgICA8dGQ+e2VudHJ5LnVybH08L3RkPlxuICAgICAgPC90cj5cbiAgICB7L2VhY2h9XG4gIDwvdGJvZHk+XG48L3RhYmxlPlxuXG48c3R5bGU+XG4gIC50Ymwge1xuICAgIGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7XG4gICAgYm9yZGVyLXNwYWNpbmc6IDA7XG4gICAgYm9yZGVyLXJhZGl1czogM3B4O1xuICAgIG1hcmdpbi1ib3R0b206IDVweDtcbiAgICB3aWR0aDogMTAwJTtcbiAgfVxuXG4gIHRyOmhvdmVyIHRkIHtcbiAgICBiYWNrZ3JvdW5kOiAjZGRkO1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgfVxuXG4gIHRoIHtcbiAgICBiYWNrZ3JvdW5kOiAjOTk5O1xuICAgIGNvbG9yOiB3aGl0ZTtcbiAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICBjdXJzb3I6IHBvaW50ZXI7XG4gIH1cblxuICB0aCxcbiAgdGQge1xuICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgdGV4dC1hbGlnbjogbGVmdDtcbiAgfVxuXG4gIHRyLmFjdGl2ZSB0ZCB7XG4gICAgY29sb3I6IGdyZWVuO1xuICB9XG5cbiAgdHI6Zmlyc3QtY2hpbGQge1xuICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCAjYmJiO1xuICB9XG5cbiAgdHI6bGFzdC1jaGlsZCB7XG4gICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNiYmI7XG4gIH1cblxuICB0aDpmaXJzdC1jaGlsZCB7XG4gICAgYm9yZGVyLWxlZnQ6IDFweCBzb2xpZCAjYmJiO1xuICB9XG5cbiAgdGg6bGFzdC1jaGlsZCB7XG4gICAgYm9yZGVyLXJpZ2h0OiAxcHggc29saWQgI2JiYjtcbiAgfVxuXG4gIHRib2R5IHRyOm50aC1jaGlsZChvZGQpIHtcbiAgICBiYWNrZ3JvdW5kOiAjZWVlO1xuICB9XG5cbiAgdGQ6Zmlyc3QtY2hpbGQge1xuICAgIGJvcmRlci1sZWZ0OiAxcHggc29saWQgI2JiYjtcbiAgfVxuXG4gIHRkOmxhc3QtY2hpbGQge1xuICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkICNiYmI7XG4gIH1cbjwvc3R5bGU+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBK0VFLGtDQUFLLENBQ0gsZUFBZSxDQUFFLFFBQVEsQ0FDekIsY0FBYyxDQUFFLENBQUMsQ0FDakIsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsS0FBSyxDQUFFLElBQ1QsQ0FFQSxpQkFBRSxNQUFNLENBQUMsaUJBQUcsQ0FDVixVQUFVLENBQUUsSUFBSSxDQUNoQixNQUFNLENBQUUsT0FDVixDQUVBLGdDQUFHLENBQ0QsVUFBVSxDQUFFLElBQUksQ0FDaEIsS0FBSyxDQUFFLEtBQUssQ0FDWixXQUFXLENBQUUsSUFBSSxDQUNqQixNQUFNLENBQUUsT0FDVixDQUVBLGdDQUFFLENBQ0YsZ0NBQUcsQ0FDRCxPQUFPLENBQUUsSUFBSSxDQUNiLFVBQVUsQ0FBRSxJQUNkLENBRUEsRUFBRSxzQkFBTyxDQUFDLGlCQUFHLENBQ1gsS0FBSyxDQUFFLEtBQ1QsQ0FFQSxnQ0FBRSxZQUFhLENBQ2IsVUFBVSxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFDeEIsQ0FFQSxnQ0FBRSxXQUFZLENBQ1osYUFBYSxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFDM0IsQ0FFQSxnQ0FBRSxZQUFhLENBQ2IsV0FBVyxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFDekIsQ0FFQSxnQ0FBRSxXQUFZLENBQ1osWUFBWSxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFDMUIsQ0FFQSxvQkFBSyxDQUFDLGlCQUFFLFdBQVcsR0FBRyxDQUFFLENBQ3RCLFVBQVUsQ0FBRSxJQUNkLENBRUEsZ0NBQUUsWUFBYSxDQUNiLFdBQVcsQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQ3pCLENBRUEsZ0NBQUUsV0FBWSxDQUNaLFlBQVksQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQzFCIn0= */");
	}

	function get_each_context$1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[6] = list[i];
		return child_ctx;
	}

	function get_each_context_1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[9] = list[i];
		return child_ctx;
	}

	// (61:6) {#each data.header as header}
	function create_each_block_1(ctx) {
		let th;
		let t_value = /*header*/ ctx[9].value + "";
		let t;
		let th_data_type_value;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				th = element("th");
				t = text(t_value);
				attr_dev(th, "data-type", th_data_type_value = /*header*/ ctx[9].type);
				attr_dev(th, "data-order", "asc");
				attr_dev(th, "class", "svelte-17ptexh");
				add_location(th, file$b, 61, 8, 1569);
			},
			m: function mount(target, anchor) {
				insert_dev(target, th, anchor);
				append_dev(th, t);

				if (!mounted) {
					dispose = listen_dev(th, "click", /*tblHeadClick*/ ctx[3], false, false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty & /*data*/ 1 && t_value !== (t_value = /*header*/ ctx[9].value + "")) set_data_dev(t, t_value);

				if (dirty & /*data*/ 1 && th_data_type_value !== (th_data_type_value = /*header*/ ctx[9].type)) {
					attr_dev(th, "data-type", th_data_type_value);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(th);
				}

				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_1.name,
			type: "each",
			source: "(61:6) {#each data.header as header}",
			ctx
		});

		return block;
	}

	// (69:4) {#each data.entries as entry}
	function create_each_block$1(ctx) {
		let tr;
		let td0;
		let t0_value = /*entry*/ ctx[6].id + "";
		let t0;
		let t1;
		let td1;
		let t2_value = /*entry*/ ctx[6].name + "";
		let t2;
		let t3;
		let td2;
		let t4_value = /*entry*/ ctx[6].url + "";
		let t4;
		let t5;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				tr = element("tr");
				td0 = element("td");
				t0 = text(t0_value);
				t1 = space();
				td1 = element("td");
				t2 = text(t2_value);
				t3 = space();
				td2 = element("td");
				t4 = text(t4_value);
				t5 = space();
				attr_dev(td0, "class", "svelte-17ptexh");
				add_location(td0, file$b, 70, 8, 1845);
				attr_dev(td1, "class", "svelte-17ptexh");
				add_location(td1, file$b, 71, 8, 1873);
				attr_dev(td2, "class", "svelte-17ptexh");
				add_location(td2, file$b, 72, 8, 1903);
				attr_dev(tr, "class", "svelte-17ptexh");
				toggle_class(tr, "active", /*selected*/ ctx[1] === /*entry*/ ctx[6].name);
				add_location(tr, file$b, 69, 6, 1763);
			},
			m: function mount(target, anchor) {
				insert_dev(target, tr, anchor);
				append_dev(tr, td0);
				append_dev(td0, t0);
				append_dev(tr, t1);
				append_dev(tr, td1);
				append_dev(td1, t2);
				append_dev(tr, t3);
				append_dev(tr, td2);
				append_dev(td2, t4);
				append_dev(tr, t5);

				if (!mounted) {
					dispose = listen_dev(
						tr,
						"click",
						function () {
							if (is_function(/*handleClick*/ ctx[2](/*entry*/ ctx[6]))) /*handleClick*/ ctx[2](/*entry*/ ctx[6]).apply(this, arguments);
						},
						false,
						false,
						false,
						false
					);

					mounted = true;
				}
			},
			p: function update(new_ctx, dirty) {
				ctx = new_ctx;
				if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*entry*/ ctx[6].id + "")) set_data_dev(t0, t0_value);
				if (dirty & /*data*/ 1 && t2_value !== (t2_value = /*entry*/ ctx[6].name + "")) set_data_dev(t2, t2_value);
				if (dirty & /*data*/ 1 && t4_value !== (t4_value = /*entry*/ ctx[6].url + "")) set_data_dev(t4, t4_value);

				if (dirty & /*selected, data*/ 3) {
					toggle_class(tr, "active", /*selected*/ ctx[1] === /*entry*/ ctx[6].name);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(tr);
				}

				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$1.name,
			type: "each",
			source: "(69:4) {#each data.entries as entry}",
			ctx
		});

		return block;
	}

	function create_fragment$b(ctx) {
		let table;
		let thead;
		let tr;
		let t;
		let tbody;
		let each_value_1 = ensure_array_like_dev(/*data*/ ctx[0].header);
		let each_blocks_1 = [];

		for (let i = 0; i < each_value_1.length; i += 1) {
			each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
		}

		let each_value = ensure_array_like_dev(/*data*/ ctx[0].entries);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
		}

		const block = {
			c: function create() {
				table = element("table");
				thead = element("thead");
				tr = element("tr");

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].c();
				}

				t = space();
				tbody = element("tbody");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr_dev(tr, "class", "svelte-17ptexh");
				add_location(tr, file$b, 59, 4, 1520);
				add_location(thead, file$b, 58, 2, 1508);
				attr_dev(tbody, "class", "svelte-17ptexh");
				add_location(tbody, file$b, 67, 2, 1715);
				attr_dev(table, "class", "tbl svelte-17ptexh");
				add_location(table, file$b, 57, 0, 1486);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, table, anchor);
				append_dev(table, thead);
				append_dev(thead, tr);

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					if (each_blocks_1[i]) {
						each_blocks_1[i].m(tr, null);
					}
				}

				append_dev(table, t);
				append_dev(table, tbody);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(tbody, null);
					}
				}
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*data, tblHeadClick*/ 9) {
					each_value_1 = ensure_array_like_dev(/*data*/ ctx[0].header);
					let i;

					for (i = 0; i < each_value_1.length; i += 1) {
						const child_ctx = get_each_context_1(ctx, each_value_1, i);

						if (each_blocks_1[i]) {
							each_blocks_1[i].p(child_ctx, dirty);
						} else {
							each_blocks_1[i] = create_each_block_1(child_ctx);
							each_blocks_1[i].c();
							each_blocks_1[i].m(tr, null);
						}
					}

					for (; i < each_blocks_1.length; i += 1) {
						each_blocks_1[i].d(1);
					}

					each_blocks_1.length = each_value_1.length;
				}

				if (dirty & /*selected, data, handleClick*/ 7) {
					each_value = ensure_array_like_dev(/*data*/ ctx[0].entries);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$1(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block$1(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(tbody, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(table);
				}

				destroy_each(each_blocks_1, detaching);
				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$b.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$b($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Table', slots, []);
		let { data = { header: [], entries: [] } } = $$props;
		let { selected = '' } = $$props;
		const dispatch = createEventDispatcher();
		const handleClick = entry => dispatch('clickedRow', entry);

		const tblHeadClick = e => {
			if (e.target.tagName != 'TH') return;
			let th = e.target;
			sortTable(th.cellIndex, th.dataset.type, th.dataset.order);

			if (th.dataset.order === 'asc') {
				th.dataset.order = 'desc';
			} else {
				th.dataset.order = 'asc';
			}
		};

		const sortTable = (colNum, type, order) => {
			let tbody = document.querySelector('tbody');
			let rowsArray = Array.from(tbody.rows);
			let compare;

			switch (type) {
				case 'date':
					compare = (rowA, rowB) => {
						Date.parse(rowA.cells[colNum].innerHTML);
						Date.parse(rowB.cells[colNum].innerHTML);
						return rowA.cells[colNum].innerHTML - rowB.cells[colNum].innerHTML;
					};
					break;
				case 'number':
					compare = (rowA, rowB) => {
						return rowA.cells[colNum].innerHTML - rowB.cells[colNum].innerHTML;
					};
					break;
				case 'string':
					compare = (rowA, rowB) => {
						return rowA.cells[colNum].innerHTML > rowB.cells[colNum].innerHTML
						? 1
						: -1;
					};
					break;
			}

			rowsArray.sort(compare);

			if (order === 'desc') {
				rowsArray.reverse();
			}

			tbody.append(...rowsArray);
		};

		const writable_props = ['data', 'selected'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Table> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('data' in $$props) $$invalidate(0, data = $$props.data);
			if ('selected' in $$props) $$invalidate(1, selected = $$props.selected);
		};

		$$self.$capture_state = () => ({
			createEventDispatcher,
			data,
			selected,
			dispatch,
			handleClick,
			tblHeadClick,
			sortTable
		});

		$$self.$inject_state = $$props => {
			if ('data' in $$props) $$invalidate(0, data = $$props.data);
			if ('selected' in $$props) $$invalidate(1, selected = $$props.selected);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [data, selected, handleClick, tblHeadClick];
	}

	class Table extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$b, create_fragment$b, safe_not_equal, { data: 0, selected: 1 }, add_css$a);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Table",
				options,
				id: create_fragment$b.name
			});
		}

		get data() {
			throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set data(value) {
			throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get selected() {
			throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set selected(value) {
			throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/Button.svelte generated by Svelte v4.2.17 */
	const file$a = "src/components/Button.svelte";

	function add_css$9(target) {
		append_styles(target, "svelte-d5hf4t", "button.svelte-d5hf4t{font-size:0.9em;margin-top:0.3em;padding:0.5em 0.8em;color:black;background:white;border-radius:0.3em;box-shadow:1px 1px 3px rgba(0, 0, 0, 0.5)}.sendBtn.svelte-d5hf4t{background:blue;color:white}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQnV0dG9uLnN2ZWx0ZSIsInNvdXJjZXMiOlsiQnV0dG9uLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBleHBvcnQgbGV0IHNlbmQgPSBmYWxzZVxuICBleHBvcnQgbGV0IGlkID0gJ2J0bidcbjwvc2NyaXB0PlxuXG48YnV0dG9uIHtpZH0gY2xhc3M6c2VuZEJ0bj17c2VuZCA9PT0gdHJ1ZX0gb246Y2xpY2s+XG4gIDxzbG90PkJ1dHRvbjwvc2xvdD5cbjwvYnV0dG9uPlxuXG48c3R5bGU+XG4gIGJ1dHRvbiB7XG4gICAgZm9udC1zaXplOiAwLjllbTtcbiAgICBtYXJnaW4tdG9wOiAwLjNlbTtcbiAgICBwYWRkaW5nOiAwLjVlbSAwLjhlbTtcbiAgICBjb2xvcjogYmxhY2s7XG4gICAgYmFja2dyb3VuZDogd2hpdGU7XG4gICAgYm9yZGVyLXJhZGl1czogMC4zZW07XG4gICAgYm94LXNoYWRvdzogMXB4IDFweCAzcHggcmdiYSgwLCAwLCAwLCAwLjUpO1xuICB9XG4gIC5zZW5kQnRuIHtcbiAgICBiYWNrZ3JvdW5kOiBibHVlO1xuICAgIGNvbG9yOiB3aGl0ZTtcbiAgfVxuPC9zdHlsZT5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFVRSxvQkFBTyxDQUNMLFNBQVMsQ0FBRSxLQUFLLENBQ2hCLFVBQVUsQ0FBRSxLQUFLLENBQ2pCLE9BQU8sQ0FBRSxLQUFLLENBQUMsS0FBSyxDQUNwQixLQUFLLENBQUUsS0FBSyxDQUNaLFVBQVUsQ0FBRSxLQUFLLENBQ2pCLGFBQWEsQ0FBRSxLQUFLLENBQ3BCLFVBQVUsQ0FBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FDM0MsQ0FDQSxzQkFBUyxDQUNQLFVBQVUsQ0FBRSxJQUFJLENBQ2hCLEtBQUssQ0FBRSxLQUNUIn0= */");
	}

	// (7:8) Button
	function fallback_block(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text("Button");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: fallback_block.name,
			type: "fallback",
			source: "(7:8) Button",
			ctx
		});

		return block;
	}

	function create_fragment$a(ctx) {
		let button;
		let current;
		let mounted;
		let dispose;
		const default_slot_template = /*#slots*/ ctx[3].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);
		const default_slot_or_fallback = default_slot || fallback_block(ctx);

		const block = {
			c: function create() {
				button = element("button");
				if (default_slot_or_fallback) default_slot_or_fallback.c();
				attr_dev(button, "id", /*id*/ ctx[1]);
				attr_dev(button, "class", "svelte-d5hf4t");
				toggle_class(button, "sendBtn", /*send*/ ctx[0] === true);
				add_location(button, file$a, 5, 0, 70);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, button, anchor);

				if (default_slot_or_fallback) {
					default_slot_or_fallback.m(button, null);
				}

				current = true;

				if (!mounted) {
					dispose = listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[2],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
							null
						);
					}
				}

				if (!current || dirty & /*id*/ 2) {
					attr_dev(button, "id", /*id*/ ctx[1]);
				}

				if (!current || dirty & /*send*/ 1) {
					toggle_class(button, "sendBtn", /*send*/ ctx[0] === true);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot_or_fallback, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot_or_fallback, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(button);
				}

				if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$a.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$a($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Button', slots, ['default']);
		let { send = false } = $$props;
		let { id = 'btn' } = $$props;
		const writable_props = ['send', 'id'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Button> was created with unknown prop '${key}'`);
		});

		function click_handler(event) {
			bubble.call(this, $$self, event);
		}

		$$self.$$set = $$props => {
			if ('send' in $$props) $$invalidate(0, send = $$props.send);
			if ('id' in $$props) $$invalidate(1, id = $$props.id);
			if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({ send, id });

		$$self.$inject_state = $$props => {
			if ('send' in $$props) $$invalidate(0, send = $$props.send);
			if ('id' in $$props) $$invalidate(1, id = $$props.id);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [send, id, $$scope, slots, click_handler];
	}

	class Button extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$a, create_fragment$a, safe_not_equal, { send: 0, id: 1 }, add_css$9);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Button",
				options,
				id: create_fragment$a.name
			});
		}

		get send() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set send(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get id() {
			throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set id(value) {
			throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/*
	Adapted from https://github.com/mattdesl
	Distributed under MIT License https://github.com/mattdesl/eases/blob/master/LICENSE.md
	*/

	/**
	 * https://svelte.dev/docs/svelte-easing
	 * @param {number} t
	 * @returns {number}
	 */
	function cubicInOut(t) {
		return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
	}

	/**
	 * https://svelte.dev/docs/svelte-easing
	 * @param {number} t
	 * @returns {number}
	 */
	function cubicOut(t) {
		const f = t - 1.0;
		return f * f * f + 1.0;
	}

	/**
	 * https://svelte.dev/docs/svelte-easing
	 * @param {number} t
	 * @returns {number}
	 */
	function quintOut(t) {
		return --t * t * t * t * t + 1;
	}

	/**
	 * Animates a `blur` filter alongside an element's opacity.
	 *
	 * https://svelte.dev/docs/svelte-transition#blur
	 * @param {Element} node
	 * @param {import('./public').BlurParams} [params]
	 * @returns {import('./public').TransitionConfig}
	 */
	function blur(
		node,
		{ delay = 0, duration = 400, easing = cubicInOut, amount = 5, opacity = 0 } = {}
	) {
		const style = getComputedStyle(node);
		const target_opacity = +style.opacity;
		const f = style.filter === 'none' ? '' : style.filter;
		const od = target_opacity * (1 - opacity);
		const [value, unit] = split_css_unit(amount);
		return {
			delay,
			duration,
			easing,
			css: (_t, u) => `opacity: ${target_opacity - od * u}; filter: ${f} blur(${u * value}${unit});`
		};
	}

	/**
	 * Animates the opacity of an element from 0 to the current opacity for `in` transitions and from the current opacity to 0 for `out` transitions.
	 *
	 * https://svelte.dev/docs/svelte-transition#fade
	 * @param {Element} node
	 * @param {import('./public').FadeParams} [params]
	 * @returns {import('./public').TransitionConfig}
	 */
	function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
		const o = +getComputedStyle(node).opacity;
		return {
			delay,
			duration,
			easing,
			css: (t) => `opacity: ${t * o}`
		};
	}

	/**
	 * Animates the x and y positions and the opacity of an element. `in` transitions animate from the provided values, passed as parameters to the element's default values. `out` transitions animate from the element's default values to the provided values.
	 *
	 * https://svelte.dev/docs/svelte-transition#fly
	 * @param {Element} node
	 * @param {import('./public').FlyParams} [params]
	 * @returns {import('./public').TransitionConfig}
	 */
	function fly(
		node,
		{ delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}
	) {
		const style = getComputedStyle(node);
		const target_opacity = +style.opacity;
		const transform = style.transform === 'none' ? '' : style.transform;
		const od = target_opacity * (1 - opacity);
		const [xValue, xUnit] = split_css_unit(x);
		const [yValue, yUnit] = split_css_unit(y);
		return {
			delay,
			duration,
			easing,
			css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * xValue}${xUnit}, ${(1 - t) * yValue}${yUnit});
			opacity: ${target_opacity - od * u}`
		};
	}

	/**
	 * Slides an element in and out.
	 *
	 * https://svelte.dev/docs/svelte-transition#slide
	 * @param {Element} node
	 * @param {import('./public').SlideParams} [params]
	 * @returns {import('./public').TransitionConfig}
	 */
	function slide(node, { delay = 0, duration = 400, easing = cubicOut, axis = 'y' } = {}) {
		const style = getComputedStyle(node);
		const opacity = +style.opacity;
		const primary_property = axis === 'y' ? 'height' : 'width';
		const primary_property_value = parseFloat(style[primary_property]);
		const secondary_properties = axis === 'y' ? ['top', 'bottom'] : ['left', 'right'];
		const capitalized_secondary_properties = secondary_properties.map(
			(e) => `${e[0].toUpperCase()}${e.slice(1)}`
		);
		const padding_start_value = parseFloat(style[`padding${capitalized_secondary_properties[0]}`]);
		const padding_end_value = parseFloat(style[`padding${capitalized_secondary_properties[1]}`]);
		const margin_start_value = parseFloat(style[`margin${capitalized_secondary_properties[0]}`]);
		const margin_end_value = parseFloat(style[`margin${capitalized_secondary_properties[1]}`]);
		const border_width_start_value = parseFloat(
			style[`border${capitalized_secondary_properties[0]}Width`]
		);
		const border_width_end_value = parseFloat(
			style[`border${capitalized_secondary_properties[1]}Width`]
		);
		return {
			delay,
			duration,
			easing,
			css: (t) =>
				'overflow: hidden;' +
				`opacity: ${Math.min(t * 20, 1) * opacity};` +
				`${primary_property}: ${t * primary_property_value}px;` +
				`padding-${secondary_properties[0]}: ${t * padding_start_value}px;` +
				`padding-${secondary_properties[1]}: ${t * padding_end_value}px;` +
				`margin-${secondary_properties[0]}: ${t * margin_start_value}px;` +
				`margin-${secondary_properties[1]}: ${t * margin_end_value}px;` +
				`border-${secondary_properties[0]}-width: ${t * border_width_start_value}px;` +
				`border-${secondary_properties[1]}-width: ${t * border_width_end_value}px;`
		};
	}

	/**
	 * Animates the opacity and scale of an element. `in` transitions animate from an element's current (default) values to the provided values, passed as parameters. `out` transitions animate from the provided values to an element's default values.
	 *
	 * https://svelte.dev/docs/svelte-transition#scale
	 * @param {Element} node
	 * @param {import('./public').ScaleParams} [params]
	 * @returns {import('./public').TransitionConfig}
	 */
	function scale(
		node,
		{ delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 } = {}
	) {
		const style = getComputedStyle(node);
		const target_opacity = +style.opacity;
		const transform = style.transform === 'none' ? '' : style.transform;
		const sd = 1 - start;
		const od = target_opacity * (1 - opacity);
		return {
			delay,
			duration,
			easing,
			css: (_t, u) => `
			transform: ${transform} scale(${1 - sd * u});
			opacity: ${target_opacity - od * u}
		`
		};
	}

	/* src/components/Modal.svelte generated by Svelte v4.2.17 */
	const file$9 = "src/components/Modal.svelte";

	function add_css$8(target) {
		append_styles(target, "svelte-4822xx", ".modal-background.svelte-4822xx{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0, 0, 0, 0.3)}.modal.svelte-4822xx{position:absolute;left:50%;top:50%;width:calc(100vw - 4em);max-width:32em;max-height:calc(100vh - 4em);overflow:auto;transform:translate(-50%, -50%);padding:1em;border-radius:0.2em;background:white;text-align:center}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kYWwuc3ZlbHRlIiwic291cmNlcyI6WyJNb2RhbC5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IEJ1dHRvbiBmcm9tICcuL0J1dHRvbi5zdmVsdGUnXG4gIGltcG9ydCB7IGZseSB9IGZyb20gJ3N2ZWx0ZS90cmFuc2l0aW9uJ1xuICBpbXBvcnQgeyBxdWludE91dCB9IGZyb20gJ3N2ZWx0ZS9lYXNpbmcnXG4gIGltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciwgb25EZXN0cm95IH0gZnJvbSAnc3ZlbHRlJ1xuXG4gIGV4cG9ydCBsZXQgbW9kYWxGb3JtID0gZmFsc2VcbiAgZXhwb3J0IGxldCBtb2RhbElkID0gJ21vZGFsJ1xuXG4gIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKClcblxuICBjb25zdCBzZW5kID0gKCkgPT4gZGlzcGF0Y2goJ3NlbmRGb3JtJylcbiAgY29uc3QgY2xvc2UgPSAoKSA9PiBkaXNwYXRjaCgnY2xvc2UnKVxuXG4gIGxldCBtb2RhbFxuXG4gIGNvbnN0IGhhbmRsZUtleWRvd24gPSAoZSkgPT4ge1xuICAgIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHtcbiAgICAgIGNsb3NlKClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoZS5rZXkgPT09ICdUYWInKSB7XG4gICAgICBjb25zdCBub2RlcyA9IG1vZGFsLnF1ZXJ5U2VsZWN0b3JBbGwoJyonKVxuICAgICAgY29uc3QgdGFiYmFibGUgPSBBcnJheS5mcm9tKG5vZGVzKS5maWx0ZXIoKG4pID0+IG4udGFiSW5kZXggPj0gMClcbiAgICAgIGxldCBpbmRleCA9IHRhYmJhYmxlLmluZGV4T2YoZG9jdW1lbnQuYWN0aXZlRWxlbWVudClcbiAgICAgIGlmIChpbmRleCA9PT0gLTEgJiYgZS5zaGlmdEtleSkgaW5kZXggPSAwXG4gICAgICBpbmRleCArPSB0YWJiYWJsZS5sZW5ndGggKyAoZS5zaGlmdEtleSA/IC0xIDogMSlcbiAgICAgIGluZGV4ICU9IHRhYmJhYmxlLmxlbmd0aFxuICAgICAgdGFiYmFibGVbaW5kZXhdLmZvY3VzKClcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHByZXZpb3VzbHlfZm9jdXNlZCA9XG4gICAgdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50XG5cbiAgaWYgKHByZXZpb3VzbHlfZm9jdXNlZCkge1xuICAgIG9uRGVzdHJveSgoKSA9PiB7XG4gICAgICBwcmV2aW91c2x5X2ZvY3VzZWQuZm9jdXMoKVxuICAgIH0pXG4gIH1cbjwvc2NyaXB0PlxuXG48c3ZlbHRlOndpbmRvdyBvbjprZXlkb3duPXtoYW5kbGVLZXlkb3dufSAvPlxuXG48ZGl2XG4gIGNsYXNzPVwibW9kYWwtYmFja2dyb3VuZFwiXG4gIG9uOmtleWRvd249e2Nsb3NlfVxuICBvbjpjbGljaz17Y2xvc2V9XG4gIHJvbGU9XCJidXR0b25cIlxuICB0YWJpbmRleD1cIjBcIlxuLz5cblxuPGRpdlxuICBpZD17bW9kYWxJZH1cbiAgY2xhc3M9XCJtb2RhbFwiXG4gIHJvbGU9XCJkaWFsb2dcIlxuICBhcmlhLW1vZGFsPVwidHJ1ZVwiXG4gIGJpbmQ6dGhpcz17bW9kYWx9XG4gIHRyYW5zaXRpb246Zmx5PXt7XG4gICAgZGVsYXk6IDAsXG4gICAgZHVyYXRpb246IDEwMDAsXG4gICAgeTogLTUwMCxcbiAgICBvcGFjaXR5OiAwLjIsXG4gICAgZWFzaW5nOiBxdWludE91dCxcbiAgfX1cbj5cbiAgPHNsb3QgbmFtZT1cImhlYWRlclwiIC8+XG4gIDxzbG90IC8+XG4gIDwhLS0gc3ZlbHRlLWlnbm9yZSBhMTF5LWF1dG9mb2N1cyAtLT5cbiAgeyNpZiBtb2RhbEZvcm19XG4gICAgPEJ1dHRvbiBzZW5kIG9uOmNsaWNrPXtzZW5kfT5TZW5kPC9CdXR0b24+XG4gIHsvaWZ9XG4gIDxCdXR0b24gaWQ9XCJtb2RhbENsb3NlQnRuXCIgb246Y2xpY2s9e2Nsb3NlfT5DbG9zZTwvQnV0dG9uPlxuPC9kaXY+XG5cbjxzdHlsZT5cbiAgLm1vZGFsLWJhY2tncm91bmQge1xuICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICB0b3A6IDA7XG4gICAgbGVmdDogMDtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBoZWlnaHQ6IDEwMCU7XG4gICAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAwLjMpO1xuICB9XG4gIC5tb2RhbCB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIGxlZnQ6IDUwJTtcbiAgICB0b3A6IDUwJTtcbiAgICB3aWR0aDogY2FsYygxMDB2dyAtIDRlbSk7XG4gICAgbWF4LXdpZHRoOiAzMmVtO1xuICAgIG1heC1oZWlnaHQ6IGNhbGMoMTAwdmggLSA0ZW0pO1xuICAgIG92ZXJmbG93OiBhdXRvO1xuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC01MCUpO1xuICAgIHBhZGRpbmc6IDFlbTtcbiAgICBib3JkZXItcmFkaXVzOiAwLjJlbTtcbiAgICBiYWNrZ3JvdW5kOiB3aGl0ZTtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIH1cbjwvc3R5bGU+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBNkVFLCtCQUFrQixDQUNoQixRQUFRLENBQUUsS0FBSyxDQUNmLEdBQUcsQ0FBRSxDQUFDLENBQ04sSUFBSSxDQUFFLENBQUMsQ0FDUCxLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxJQUFJLENBQ1osVUFBVSxDQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUMvQixDQUNBLG9CQUFPLENBQ0wsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsSUFBSSxDQUFFLEdBQUcsQ0FDVCxHQUFHLENBQUUsR0FBRyxDQUNSLEtBQUssQ0FBRSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQ3hCLFNBQVMsQ0FBRSxJQUFJLENBQ2YsVUFBVSxDQUFFLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FDN0IsUUFBUSxDQUFFLElBQUksQ0FDZCxTQUFTLENBQUUsVUFBVSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FDaEMsT0FBTyxDQUFFLEdBQUcsQ0FDWixhQUFhLENBQUUsS0FBSyxDQUNwQixVQUFVLENBQUUsS0FBSyxDQUNqQixVQUFVLENBQUUsTUFDZCJ9 */");
	}

	const get_header_slot_changes = dirty => ({});
	const get_header_slot_context = ctx => ({});

	// (71:2) {#if modalForm}
	function create_if_block$6(ctx) {
		let button;
		let current;

		button = new Button({
				props: {
					send: true,
					$$slots: { default: [create_default_slot_1$1] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		button.$on("click", /*send*/ ctx[3]);

		const block = {
			c: function create() {
				create_component(button.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(button, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const button_changes = {};

				if (dirty & /*$$scope*/ 256) {
					button_changes.$$scope = { dirty, ctx };
				}

				button.$set(button_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(button.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(button.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(button, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$6.name,
			type: "if",
			source: "(71:2) {#if modalForm}",
			ctx
		});

		return block;
	}

	// (72:4) <Button send on:click={send}>
	function create_default_slot_1$1(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text("Send");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_1$1.name,
			type: "slot",
			source: "(72:4) <Button send on:click={send}>",
			ctx
		});

		return block;
	}

	// (74:2) <Button id="modalCloseBtn" on:click={close}>
	function create_default_slot$2(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text("Close");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$2.name,
			type: "slot",
			source: "(74:2) <Button id=\\\"modalCloseBtn\\\" on:click={close}>",
			ctx
		});

		return block;
	}

	function create_fragment$9(ctx) {
		let div0;
		let t0;
		let div1;
		let t1;
		let t2;
		let t3;
		let button;
		let div1_transition;
		let current;
		let mounted;
		let dispose;
		const header_slot_template = /*#slots*/ ctx[6].header;
		const header_slot = create_slot(header_slot_template, ctx, /*$$scope*/ ctx[8], get_header_slot_context);
		const default_slot_template = /*#slots*/ ctx[6].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);
		let if_block = /*modalForm*/ ctx[0] && create_if_block$6(ctx);

		button = new Button({
				props: {
					id: "modalCloseBtn",
					$$slots: { default: [create_default_slot$2] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		button.$on("click", /*close*/ ctx[4]);

		const block = {
			c: function create() {
				div0 = element("div");
				t0 = space();
				div1 = element("div");
				if (header_slot) header_slot.c();
				t1 = space();
				if (default_slot) default_slot.c();
				t2 = space();
				if (if_block) if_block.c();
				t3 = space();
				create_component(button.$$.fragment);
				attr_dev(div0, "class", "modal-background svelte-4822xx");
				attr_dev(div0, "role", "button");
				attr_dev(div0, "tabindex", "0");
				add_location(div0, file$9, 45, 0, 1142);
				attr_dev(div1, "id", /*modalId*/ ctx[1]);
				attr_dev(div1, "class", "modal svelte-4822xx");
				attr_dev(div1, "role", "dialog");
				attr_dev(div1, "aria-modal", "true");
				add_location(div1, file$9, 53, 0, 1249);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div0, anchor);
				insert_dev(target, t0, anchor);
				insert_dev(target, div1, anchor);

				if (header_slot) {
					header_slot.m(div1, null);
				}

				append_dev(div1, t1);

				if (default_slot) {
					default_slot.m(div1, null);
				}

				append_dev(div1, t2);
				if (if_block) if_block.m(div1, null);
				append_dev(div1, t3);
				mount_component(button, div1, null);
				/*div1_binding*/ ctx[7](div1);
				current = true;

				if (!mounted) {
					dispose = [
						listen_dev(window, "keydown", /*handleKeydown*/ ctx[5], false, false, false, false),
						listen_dev(div0, "keydown", /*close*/ ctx[4], false, false, false, false),
						listen_dev(div0, "click", /*close*/ ctx[4], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (header_slot) {
					if (header_slot.p && (!current || dirty & /*$$scope*/ 256)) {
						update_slot_base(
							header_slot,
							header_slot_template,
							ctx,
							/*$$scope*/ ctx[8],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
							: get_slot_changes(header_slot_template, /*$$scope*/ ctx[8], dirty, get_header_slot_changes),
							get_header_slot_context
						);
					}
				}

				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 256)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[8],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[8], dirty, null),
							null
						);
					}
				}

				if (/*modalForm*/ ctx[0]) {
					if (if_block) {
						if_block.p(ctx, dirty);

						if (dirty & /*modalForm*/ 1) {
							transition_in(if_block, 1);
						}
					} else {
						if_block = create_if_block$6(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(div1, t3);
					}
				} else if (if_block) {
					group_outros();

					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});

					check_outros();
				}

				const button_changes = {};

				if (dirty & /*$$scope*/ 256) {
					button_changes.$$scope = { dirty, ctx };
				}

				button.$set(button_changes);

				if (!current || dirty & /*modalId*/ 2) {
					attr_dev(div1, "id", /*modalId*/ ctx[1]);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(header_slot, local);
				transition_in(default_slot, local);
				transition_in(if_block);
				transition_in(button.$$.fragment, local);

				if (local) {
					add_render_callback(() => {
						if (!current) return;

						if (!div1_transition) div1_transition = create_bidirectional_transition(
							div1,
							fly,
							{
								delay: 0,
								duration: 1000,
								y: -500,
								opacity: 0.2,
								easing: quintOut
							},
							true
						);

						div1_transition.run(1);
					});
				}

				current = true;
			},
			o: function outro(local) {
				transition_out(header_slot, local);
				transition_out(default_slot, local);
				transition_out(if_block);
				transition_out(button.$$.fragment, local);

				if (local) {
					if (!div1_transition) div1_transition = create_bidirectional_transition(
						div1,
						fly,
						{
							delay: 0,
							duration: 1000,
							y: -500,
							opacity: 0.2,
							easing: quintOut
						},
						false
					);

					div1_transition.run(0);
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div0);
					detach_dev(t0);
					detach_dev(div1);
				}

				if (header_slot) header_slot.d(detaching);
				if (default_slot) default_slot.d(detaching);
				if (if_block) if_block.d();
				destroy_component(button);
				/*div1_binding*/ ctx[7](null);
				if (detaching && div1_transition) div1_transition.end();
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$9.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$9($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Modal', slots, ['header','default']);
		let { modalForm = false } = $$props;
		let { modalId = 'modal' } = $$props;
		const dispatch = createEventDispatcher();
		const send = () => dispatch('sendForm');
		const close = () => dispatch('close');
		let modal;

		const handleKeydown = e => {
			if (e.key === 'Escape') {
				close();
				return;
			}

			if (e.key === 'Tab') {
				const nodes = modal.querySelectorAll('*');
				const tabbable = Array.from(nodes).filter(n => n.tabIndex >= 0);
				let index = tabbable.indexOf(document.activeElement);
				if (index === -1 && e.shiftKey) index = 0;
				index += tabbable.length + (e.shiftKey ? -1 : 1);
				index %= tabbable.length;
				tabbable[index].focus();
				e.preventDefault();
			}
		};

		const previously_focused = typeof document !== 'undefined' && document.activeElement;

		if (previously_focused) {
			onDestroy(() => {
				previously_focused.focus();
			});
		}

		const writable_props = ['modalForm', 'modalId'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Modal> was created with unknown prop '${key}'`);
		});

		function div1_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				modal = $$value;
				$$invalidate(2, modal);
			});
		}

		$$self.$$set = $$props => {
			if ('modalForm' in $$props) $$invalidate(0, modalForm = $$props.modalForm);
			if ('modalId' in $$props) $$invalidate(1, modalId = $$props.modalId);
			if ('$$scope' in $$props) $$invalidate(8, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({
			Button,
			fly,
			quintOut,
			createEventDispatcher,
			onDestroy,
			modalForm,
			modalId,
			dispatch,
			send,
			close,
			modal,
			handleKeydown,
			previously_focused
		});

		$$self.$inject_state = $$props => {
			if ('modalForm' in $$props) $$invalidate(0, modalForm = $$props.modalForm);
			if ('modalId' in $$props) $$invalidate(1, modalId = $$props.modalId);
			if ('modal' in $$props) $$invalidate(2, modal = $$props.modal);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			modalForm,
			modalId,
			modal,
			send,
			close,
			handleKeydown,
			slots,
			div1_binding,
			$$scope
		];
	}

	class Modal extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$9, create_fragment$9, safe_not_equal, { modalForm: 0, modalId: 1 }, add_css$8);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Modal",
				options,
				id: create_fragment$9.name
			});
		}

		get modalForm() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set modalForm(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get modalId() {
			throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set modalId(value) {
			throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/ModalDialog.svelte generated by Svelte v4.2.17 */
	const file$8 = "src/components/ModalDialog.svelte";

	// (23:0) <Button id="modalDialogBtn" on:click={open}>
	function create_default_slot_1(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text(/*btnText*/ ctx[3]);
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*btnText*/ 8) set_data_dev(t, /*btnText*/ ctx[3]);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_1.name,
			type: "slot",
			source: "(23:0) <Button id=\\\"modalDialogBtn\\\" on:click={open}>",
			ctx
		});

		return block;
	}

	// (25:0) {#if showModal}
	function create_if_block$5(ctx) {
		let modal;
		let current;

		modal = new Modal({
				props: {
					modalId: "modalDialog",
					$$slots: {
						header: [create_header_slot$1],
						default: [create_default_slot$1]
					},
					$$scope: { ctx }
				},
				$$inline: true
			});

		modal.$on("close", /*close*/ ctx[5]);

		const block = {
			c: function create() {
				create_component(modal.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(modal, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const modal_changes = {};

				if (dirty & /*$$scope, headline, body*/ 134) {
					modal_changes.$$scope = { dirty, ctx };
				}

				modal.$set(modal_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(modal.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(modal.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(modal, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$5.name,
			type: "if",
			source: "(25:0) {#if showModal}",
			ctx
		});

		return block;
	}

	// (26:2) <Modal modalId="modalDialog" on:close={close}>
	function create_default_slot$1(ctx) {
		let p;

		const block = {
			c: function create() {
				p = element("p");
				add_location(p, file$8, 27, 4, 611);
			},
			m: function mount(target, anchor) {
				insert_dev(target, p, anchor);
				p.innerHTML = /*body*/ ctx[2];
			},
			p: function update(ctx, dirty) {
				if (dirty & /*body*/ 4) p.innerHTML = /*body*/ ctx[2];		},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(p);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$1.name,
			type: "slot",
			source: "(26:2) <Modal modalId=\\\"modalDialog\\\" on:close={close}>",
			ctx
		});

		return block;
	}

	// (27:4) 
	function create_header_slot$1(ctx) {
		let h2;
		let t;

		const block = {
			c: function create() {
				h2 = element("h2");
				t = text(/*headline*/ ctx[1]);
				attr_dev(h2, "slot", "header");
				add_location(h2, file$8, 26, 4, 573);
			},
			m: function mount(target, anchor) {
				insert_dev(target, h2, anchor);
				append_dev(h2, t);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*headline*/ 2) set_data_dev(t, /*headline*/ ctx[1]);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(h2);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_header_slot$1.name,
			type: "slot",
			source: "(27:4) ",
			ctx
		});

		return block;
	}

	function create_fragment$8(ctx) {
		let button;
		let t;
		let if_block_anchor;
		let current;

		button = new Button({
				props: {
					id: "modalDialogBtn",
					$$slots: { default: [create_default_slot_1] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		button.$on("click", /*open*/ ctx[4]);
		let if_block = /*showModal*/ ctx[0] && create_if_block$5(ctx);

		const block = {
			c: function create() {
				create_component(button.$$.fragment);
				t = space();
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				mount_component(button, target, anchor);
				insert_dev(target, t, anchor);
				if (if_block) if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const button_changes = {};

				if (dirty & /*$$scope, btnText*/ 136) {
					button_changes.$$scope = { dirty, ctx };
				}

				button.$set(button_changes);

				if (/*showModal*/ ctx[0]) {
					if (if_block) {
						if_block.p(ctx, dirty);

						if (dirty & /*showModal*/ 1) {
							transition_in(if_block, 1);
						}
					} else {
						if_block = create_if_block$5(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					group_outros();

					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(button.$$.fragment, local);
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(button.$$.fragment, local);
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
					detach_dev(if_block_anchor);
				}

				destroy_component(button, detaching);
				if (if_block) if_block.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$8.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$8($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('ModalDialog', slots, []);
		let { showModal = false } = $$props;
		let { headline = 'Modal' } = $$props;
		let { body = '' } = $$props;
		let { btnText = 'Modal Dialog' } = $$props;
		const dispatch = createEventDispatcher();

		const open = () => {
			$$invalidate(0, showModal = true);
		};

		const close = () => {
			dispatch('close', {});
			$$invalidate(0, showModal = false);
		};

		const writable_props = ['showModal', 'headline', 'body', 'btnText'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ModalDialog> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('showModal' in $$props) $$invalidate(0, showModal = $$props.showModal);
			if ('headline' in $$props) $$invalidate(1, headline = $$props.headline);
			if ('body' in $$props) $$invalidate(2, body = $$props.body);
			if ('btnText' in $$props) $$invalidate(3, btnText = $$props.btnText);
		};

		$$self.$capture_state = () => ({
			Modal,
			Button,
			createEventDispatcher,
			showModal,
			headline,
			body,
			btnText,
			dispatch,
			open,
			close
		});

		$$self.$inject_state = $$props => {
			if ('showModal' in $$props) $$invalidate(0, showModal = $$props.showModal);
			if ('headline' in $$props) $$invalidate(1, headline = $$props.headline);
			if ('body' in $$props) $$invalidate(2, body = $$props.body);
			if ('btnText' in $$props) $$invalidate(3, btnText = $$props.btnText);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [showModal, headline, body, btnText, open, close];
	}

	class ModalDialog extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(this, options, instance$8, create_fragment$8, safe_not_equal, {
				showModal: 0,
				headline: 1,
				body: 2,
				btnText: 3
			});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "ModalDialog",
				options,
				id: create_fragment$8.name
			});
		}

		get showModal() {
			throw new Error("<ModalDialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set showModal(value) {
			throw new Error("<ModalDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get headline() {
			throw new Error("<ModalDialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set headline(value) {
			throw new Error("<ModalDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get body() {
			throw new Error("<ModalDialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set body(value) {
			throw new Error("<ModalDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get btnText() {
			throw new Error("<ModalDialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set btnText(value) {
			throw new Error("<ModalDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/ModalForm.svelte generated by Svelte v4.2.17 */
	const file$7 = "src/components/ModalForm.svelte";

	function add_css$7(target) {
		append_styles(target, "svelte-13cwivs", "input[type='text'].svelte-13cwivs{width:90%}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kYWxGb3JtLnN2ZWx0ZSIsInNvdXJjZXMiOlsiTW9kYWxGb3JtLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIsIG9uRGVzdHJveSB9IGZyb20gJ3N2ZWx0ZSdcbiAgaW1wb3J0IE1vZGFsIGZyb20gJy4vTW9kYWwuc3ZlbHRlJ1xuXG4gIGV4cG9ydCBsZXQgc2hvd01vZGFsID0gZmFsc2VcbiAgZXhwb3J0IGxldCBtb2RhbEZvcm0gPSB0cnVlXG4gIGV4cG9ydCBsZXQgaGVhZGxpbmUgPSAnTW9kYWwnXG4gIGV4cG9ydCBsZXQgdmFsdWVOYW1lID0gJydcbiAgZXhwb3J0IGxldCB2YWx1ZVVybCA9ICcnXG4gIGV4cG9ydCBsZXQgcGxhY2Vob2xkZXJOYW1lID0gJ05hbWUnXG4gIGV4cG9ydCBsZXQgcGxhY2Vob2xkZXJVcmwgPSAnVVJMJ1xuXG4gIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKClcblxuICBjb25zdCBzZW5kRm9ybSA9ICgpID0+IHtcbiAgICBkaXNwYXRjaCgnc2VuZEZvcm0nLCB7IG5hbWU6IHZhbHVlTmFtZSwgdXJsOiB2YWx1ZVVybCB9KVxuICAgIHNob3dNb2RhbCA9IGZhbHNlXG4gIH1cblxuICBjb25zdCBjbG9zZSA9ICgpID0+IHtcbiAgICBkaXNwYXRjaCgnY2xvc2UnLCB7fSlcbiAgICBzaG93TW9kYWwgPSBmYWxzZVxuICB9XG48L3NjcmlwdD5cblxueyNpZiBzaG93TW9kYWx9XG4gIDxNb2RhbFxuICAgIG1vZGFsSWQ9XCJtb2RhbEZvcm1cIlxuICAgIHttb2RhbEZvcm19XG4gICAgb246Y2xvc2U9e2Nsb3NlfVxuICAgIG9uOnNlbmRGb3JtPXtzZW5kRm9ybX1cbiAgPlxuICAgIDxoMiBzbG90PVwiaGVhZGVyXCI+e2hlYWRsaW5lfTwvaDI+XG4gICAgPGRpdj5cbiAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIGJpbmQ6dmFsdWU9e3ZhbHVlTmFtZX0gcGxhY2Vob2xkZXI9e3BsYWNlaG9sZGVyTmFtZX0gLz5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2PlxuICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgYmluZDp2YWx1ZT17dmFsdWVVcmx9IHBsYWNlaG9sZGVyPXtwbGFjZWhvbGRlclVybH0gLz5cbiAgICA8L2Rpdj5cbiAgPC9Nb2RhbD5cbnsvaWZ9XG5cbjxzdHlsZT5cbiAgaW5wdXRbdHlwZT0ndGV4dCddIHtcbiAgICB3aWR0aDogOTAlO1xuICB9XG48L3N0eWxlPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTJDRSxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sZ0JBQUUsQ0FDakIsS0FBSyxDQUFFLEdBQ1QifQ== */");
	}

	// (26:0) {#if showModal}
	function create_if_block$4(ctx) {
		let modal;
		let current;

		modal = new Modal({
				props: {
					modalId: "modalForm",
					modalForm: /*modalForm*/ ctx[3],
					$$slots: {
						header: [create_header_slot],
						default: [create_default_slot]
					},
					$$scope: { ctx }
				},
				$$inline: true
			});

		modal.$on("close", /*close*/ ctx[8]);
		modal.$on("sendForm", /*sendForm*/ ctx[7]);

		const block = {
			c: function create() {
				create_component(modal.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(modal, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const modal_changes = {};
				if (dirty & /*modalForm*/ 8) modal_changes.modalForm = /*modalForm*/ ctx[3];

				if (dirty & /*$$scope, headline, placeholderUrl, valueUrl, placeholderName, valueName*/ 4214) {
					modal_changes.$$scope = { dirty, ctx };
				}

				modal.$set(modal_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(modal.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(modal.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(modal, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$4.name,
			type: "if",
			source: "(26:0) {#if showModal}",
			ctx
		});

		return block;
	}

	// (27:2) <Modal     modalId="modalForm"     {modalForm}     on:close={close}     on:sendForm={sendForm}   >
	function create_default_slot(ctx) {
		let div0;
		let input0;
		let t;
		let div1;
		let input1;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				div0 = element("div");
				input0 = element("input");
				t = space();
				div1 = element("div");
				input1 = element("input");
				attr_dev(input0, "type", "text");
				attr_dev(input0, "placeholder", /*placeholderName*/ ctx[5]);
				attr_dev(input0, "class", "svelte-13cwivs");
				add_location(input0, file$7, 34, 6, 747);
				add_location(div0, file$7, 33, 4, 735);
				attr_dev(input1, "type", "text");
				attr_dev(input1, "placeholder", /*placeholderUrl*/ ctx[6]);
				attr_dev(input1, "class", "svelte-13cwivs");
				add_location(input1, file$7, 37, 6, 849);
				add_location(div1, file$7, 36, 4, 837);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div0, anchor);
				append_dev(div0, input0);
				set_input_value(input0, /*valueName*/ ctx[1]);
				insert_dev(target, t, anchor);
				insert_dev(target, div1, anchor);
				append_dev(div1, input1);
				set_input_value(input1, /*valueUrl*/ ctx[2]);

				if (!mounted) {
					dispose = [
						listen_dev(input0, "input", /*input0_input_handler*/ ctx[9]),
						listen_dev(input1, "input", /*input1_input_handler*/ ctx[10])
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty & /*placeholderName*/ 32) {
					attr_dev(input0, "placeholder", /*placeholderName*/ ctx[5]);
				}

				if (dirty & /*valueName*/ 2 && input0.value !== /*valueName*/ ctx[1]) {
					set_input_value(input0, /*valueName*/ ctx[1]);
				}

				if (dirty & /*placeholderUrl*/ 64) {
					attr_dev(input1, "placeholder", /*placeholderUrl*/ ctx[6]);
				}

				if (dirty & /*valueUrl*/ 4 && input1.value !== /*valueUrl*/ ctx[2]) {
					set_input_value(input1, /*valueUrl*/ ctx[2]);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div0);
					detach_dev(t);
					detach_dev(div1);
				}

				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot.name,
			type: "slot",
			source: "(27:2) <Modal     modalId=\\\"modalForm\\\"     {modalForm}     on:close={close}     on:sendForm={sendForm}   >",
			ctx
		});

		return block;
	}

	// (33:4) 
	function create_header_slot(ctx) {
		let h2;
		let t;

		const block = {
			c: function create() {
				h2 = element("h2");
				t = text(/*headline*/ ctx[4]);
				attr_dev(h2, "slot", "header");
				add_location(h2, file$7, 32, 4, 697);
			},
			m: function mount(target, anchor) {
				insert_dev(target, h2, anchor);
				append_dev(h2, t);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*headline*/ 16) set_data_dev(t, /*headline*/ ctx[4]);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(h2);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_header_slot.name,
			type: "slot",
			source: "(33:4) ",
			ctx
		});

		return block;
	}

	function create_fragment$7(ctx) {
		let if_block_anchor;
		let current;
		let if_block = /*showModal*/ ctx[0] && create_if_block$4(ctx);

		const block = {
			c: function create() {
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (/*showModal*/ ctx[0]) {
					if (if_block) {
						if_block.p(ctx, dirty);

						if (dirty & /*showModal*/ 1) {
							transition_in(if_block, 1);
						}
					} else {
						if_block = create_if_block$4(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					group_outros();

					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if (if_block) if_block.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$7.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$7($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('ModalForm', slots, []);
		let { showModal = false } = $$props;
		let { modalForm = true } = $$props;
		let { headline = 'Modal' } = $$props;
		let { valueName = '' } = $$props;
		let { valueUrl = '' } = $$props;
		let { placeholderName = 'Name' } = $$props;
		let { placeholderUrl = 'URL' } = $$props;
		const dispatch = createEventDispatcher();

		const sendForm = () => {
			dispatch('sendForm', { name: valueName, url: valueUrl });
			$$invalidate(0, showModal = false);
		};

		const close = () => {
			dispatch('close', {});
			$$invalidate(0, showModal = false);
		};

		const writable_props = [
			'showModal',
			'modalForm',
			'headline',
			'valueName',
			'valueUrl',
			'placeholderName',
			'placeholderUrl'
		];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ModalForm> was created with unknown prop '${key}'`);
		});

		function input0_input_handler() {
			valueName = this.value;
			$$invalidate(1, valueName);
		}

		function input1_input_handler() {
			valueUrl = this.value;
			$$invalidate(2, valueUrl);
		}

		$$self.$$set = $$props => {
			if ('showModal' in $$props) $$invalidate(0, showModal = $$props.showModal);
			if ('modalForm' in $$props) $$invalidate(3, modalForm = $$props.modalForm);
			if ('headline' in $$props) $$invalidate(4, headline = $$props.headline);
			if ('valueName' in $$props) $$invalidate(1, valueName = $$props.valueName);
			if ('valueUrl' in $$props) $$invalidate(2, valueUrl = $$props.valueUrl);
			if ('placeholderName' in $$props) $$invalidate(5, placeholderName = $$props.placeholderName);
			if ('placeholderUrl' in $$props) $$invalidate(6, placeholderUrl = $$props.placeholderUrl);
		};

		$$self.$capture_state = () => ({
			createEventDispatcher,
			onDestroy,
			Modal,
			showModal,
			modalForm,
			headline,
			valueName,
			valueUrl,
			placeholderName,
			placeholderUrl,
			dispatch,
			sendForm,
			close
		});

		$$self.$inject_state = $$props => {
			if ('showModal' in $$props) $$invalidate(0, showModal = $$props.showModal);
			if ('modalForm' in $$props) $$invalidate(3, modalForm = $$props.modalForm);
			if ('headline' in $$props) $$invalidate(4, headline = $$props.headline);
			if ('valueName' in $$props) $$invalidate(1, valueName = $$props.valueName);
			if ('valueUrl' in $$props) $$invalidate(2, valueUrl = $$props.valueUrl);
			if ('placeholderName' in $$props) $$invalidate(5, placeholderName = $$props.placeholderName);
			if ('placeholderUrl' in $$props) $$invalidate(6, placeholderUrl = $$props.placeholderUrl);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			showModal,
			valueName,
			valueUrl,
			modalForm,
			headline,
			placeholderName,
			placeholderUrl,
			sendForm,
			close,
			input0_input_handler,
			input1_input_handler
		];
	}

	class ModalForm extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(
				this,
				options,
				instance$7,
				create_fragment$7,
				safe_not_equal,
				{
					showModal: 0,
					modalForm: 3,
					headline: 4,
					valueName: 1,
					valueUrl: 2,
					placeholderName: 5,
					placeholderUrl: 6
				},
				add_css$7
			);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "ModalForm",
				options,
				id: create_fragment$7.name
			});
		}

		get showModal() {
			throw new Error("<ModalForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set showModal(value) {
			throw new Error("<ModalForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get modalForm() {
			throw new Error("<ModalForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set modalForm(value) {
			throw new Error("<ModalForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get headline() {
			throw new Error("<ModalForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set headline(value) {
			throw new Error("<ModalForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get valueName() {
			throw new Error("<ModalForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set valueName(value) {
			throw new Error("<ModalForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get valueUrl() {
			throw new Error("<ModalForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set valueUrl(value) {
			throw new Error("<ModalForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get placeholderName() {
			throw new Error("<ModalForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set placeholderName(value) {
			throw new Error("<ModalForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get placeholderUrl() {
			throw new Error("<ModalForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set placeholderUrl(value) {
			throw new Error("<ModalForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/UserInput.svelte generated by Svelte v4.2.17 */
	const file$6 = "src/components/UserInput.svelte";

	function add_css$6(target) {
		append_styles(target, "svelte-ky7x3z", "input[type='text'].svelte-ky7x3z{border-radius:3px 3px 3px 3px;margin-left:5px;margin-right:20px;font-size:12pt}.user-input.svelte-ky7x3z{margin-top:10px;font-size:12pt}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXNlcklucHV0LnN2ZWx0ZSIsInNvdXJjZXMiOlsiVXNlcklucHV0LnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIgfSBmcm9tICdzdmVsdGUnXG5cbiAgZXhwb3J0IGxldCB1c2VySW5wdXQgPSAnJ1xuXG4gIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKClcblxuICBjb25zdCBrZXlwcmVzcyA9ICgpID0+IHtcbiAgICBkaXNwYXRjaCgnaW5wdXQnLCB7IGlucHV0OiB1c2VySW5wdXQgfSlcbiAgfVxuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJ1c2VyLWlucHV0XCI+XG4gIFR3by13YXkgYmluZGluZ1xuICA8aW5wdXQgdHlwZT1cInRleHRcIiBiaW5kOnZhbHVlPXt1c2VySW5wdXR9IG9uOmtleXVwPXtrZXlwcmVzc30gLz5cbiAgPHNwYW4+e3VzZXJJbnB1dH08L3NwYW4+XG48L2Rpdj5cblxuPHN0eWxlPlxuICBpbnB1dFt0eXBlPSd0ZXh0J10ge1xuICAgIGJvcmRlci1yYWRpdXM6IDNweCAzcHggM3B4IDNweDtcbiAgICBtYXJnaW4tbGVmdDogNXB4O1xuICAgIG1hcmdpbi1yaWdodDogMjBweDtcbiAgICBmb250LXNpemU6IDEycHQ7XG4gIH1cbiAgLnVzZXItaW5wdXQge1xuICAgIG1hcmdpbi10b3A6IDEwcHg7XG4gICAgZm9udC1zaXplOiAxMnB0O1xuICB9XG48L3N0eWxlPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQW1CRSxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sZUFBRSxDQUNqQixhQUFhLENBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUM5QixXQUFXLENBQUUsR0FBRyxDQUNoQixZQUFZLENBQUUsSUFBSSxDQUNsQixTQUFTLENBQUUsSUFDYixDQUNBLHlCQUFZLENBQ1YsVUFBVSxDQUFFLElBQUksQ0FDaEIsU0FBUyxDQUFFLElBQ2IifQ== */");
	}

	function create_fragment$6(ctx) {
		let div;
		let t0;
		let input;
		let t1;
		let span;
		let t2;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				div = element("div");
				t0 = text("Two-way binding\n  ");
				input = element("input");
				t1 = space();
				span = element("span");
				t2 = text(/*userInput*/ ctx[0]);
				attr_dev(input, "type", "text");
				attr_dev(input, "class", "svelte-ky7x3z");
				add_location(input, file$6, 14, 2, 263);
				add_location(span, file$6, 15, 2, 330);
				attr_dev(div, "class", "user-input svelte-ky7x3z");
				add_location(div, file$6, 12, 0, 218);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, t0);
				append_dev(div, input);
				set_input_value(input, /*userInput*/ ctx[0]);
				append_dev(div, t1);
				append_dev(div, span);
				append_dev(span, t2);

				if (!mounted) {
					dispose = [
						listen_dev(input, "input", /*input_input_handler*/ ctx[2]),
						listen_dev(input, "keyup", /*keypress*/ ctx[1], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*userInput*/ 1 && input.value !== /*userInput*/ ctx[0]) {
					set_input_value(input, /*userInput*/ ctx[0]);
				}

				if (dirty & /*userInput*/ 1) set_data_dev(t2, /*userInput*/ ctx[0]);
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$6.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$6($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('UserInput', slots, []);
		let { userInput = '' } = $$props;
		const dispatch = createEventDispatcher();

		const keypress = () => {
			dispatch('input', { input: userInput });
		};

		const writable_props = ['userInput'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<UserInput> was created with unknown prop '${key}'`);
		});

		function input_input_handler() {
			userInput = this.value;
			$$invalidate(0, userInput);
		}

		$$self.$$set = $$props => {
			if ('userInput' in $$props) $$invalidate(0, userInput = $$props.userInput);
		};

		$$self.$capture_state = () => ({
			createEventDispatcher,
			userInput,
			dispatch,
			keypress
		});

		$$self.$inject_state = $$props => {
			if ('userInput' in $$props) $$invalidate(0, userInput = $$props.userInput);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [userInput, keypress, input_input_handler];
	}

	class UserInput extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$6, create_fragment$6, safe_not_equal, { userInput: 0 }, add_css$6);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "UserInput",
				options,
				id: create_fragment$6.name
			});
		}

		get userInput() {
			throw new Error("<UserInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set userInput(value) {
			throw new Error("<UserInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/RadioBoxes.svelte generated by Svelte v4.2.17 */
	const file$5 = "src/components/RadioBoxes.svelte";

	function add_css$5(target) {
		append_styles(target, "svelte-bz45mt", ".selection-container.svelte-bz45mt.svelte-bz45mt{display:flex;padding:3px;border-radius:0 0 5px 0;box-shadow:2px 2px 3px #eee}.selection-container.svelte-bz45mt>div.svelte-bz45mt:not(:first-child){margin-left:5px;margin-top:5px}fieldset.svelte-bz45mt.svelte-bz45mt{border:1px solid #eee;border-radius:5px 5px 5px 5px}.active.svelte-bz45mt.svelte-bz45mt{color:#00f}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmFkaW9Cb3hlcy5zdmVsdGUiLCJzb3VyY2VzIjpbIlJhZGlvQm94ZXMuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJ3N2ZWx0ZSdcblxuICBleHBvcnQgbGV0IHNlbGVjdGlvbnMgPSBbXVxuXG4gIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKClcbiAgbGV0IGN1cnJlbnQgPSAnJ1xuICBsZXQgaW5mb3JtYXRpb24gPSAnPHA+Tm90aGluZyB0byBkaXNwbGF5LjwvcD4nXG5cbiAgY29uc3Qgc2V0U2VsZWN0aW9uID0gKHNlbGVjdG9yKSA9PiB7XG4gICAgY3VycmVudCA9IHNlbGVjdG9yXG4gICAgY29uc3QgaXRlbSA9IHNlbGVjdGlvbnMuZmluZCgobykgPT4gby5zZWxlY3RvciA9PT0gc2VsZWN0b3IpXG4gICAgaW5mb3JtYXRpb24gPSBpdGVtLnRleHRcbiAgICBkaXNwYXRjaCgnc2VsZWN0JywgeyBjdXJyZW50IH0pXG4gIH1cbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwic2VsZWN0aW9uLWNvbnRhaW5lclwiPlxuICA8ZGl2PlxuICAgIDxmaWVsZHNldD5cbiAgICAgIHsjZWFjaCBzZWxlY3Rpb25zIGFzIHsgc2VsZWN0b3IsIGxhYmVsIH0sIGl9XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgb246a2V5ZG93bj17c2V0U2VsZWN0aW9uKHNlbGVjdG9yKX1cbiAgICAgICAgICBvbjpjbGljaz17c2V0U2VsZWN0aW9uKHNlbGVjdG9yKX1cbiAgICAgICAgICByb2xlPVwiYnV0dG9uXCJcbiAgICAgICAgICB0YWJpbmRleD1cIjBcIlxuICAgICAgICA+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzOmFjdGl2ZT17Y3VycmVudCA9PT0gc2VsZWN0b3J9PlxuICAgICAgICAgICAge2xhYmVsfVxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIHR5cGU9XCJyYWRpb1wiXG4gICAgICAgICAgICAgIG5hbWU9XCJzZWxlY3Rpb25cIlxuICAgICAgICAgICAgICBpZD17c2VsZWN0b3J9XG4gICAgICAgICAgICAgIHRpdGxlPXtzZWxlY3Rvcn1cbiAgICAgICAgICAgICAgdmFsdWU9e3NlbGVjdG9yfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICA8L3NwYW4+XG4gICAgICB7L2VhY2h9XG4gICAgPC9maWVsZHNldD5cbiAgPC9kaXY+XG4gIDxkaXY+XG4gICAgVGhlIHVzZXIgc2VsZWN0ZWQge2N1cnJlbnQgPyBjdXJyZW50IDogJ25vdGhpbmcnfS5cbiAgICB7QGh0bWwgaW5mb3JtYXRpb259XG4gIDwvZGl2PlxuPC9kaXY+XG5cbjxzdHlsZT5cbiAgLnNlbGVjdGlvbi1jb250YWluZXIge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgcGFkZGluZzogM3B4O1xuICAgIGJvcmRlci1yYWRpdXM6IDAgMCA1cHggMDtcbiAgICBib3gtc2hhZG93OiAycHggMnB4IDNweCAjZWVlO1xuICB9XG4gIC5zZWxlY3Rpb24tY29udGFpbmVyID4gZGl2Om5vdCg6Zmlyc3QtY2hpbGQpIHtcbiAgICBtYXJnaW4tbGVmdDogNXB4O1xuICAgIG1hcmdpbi10b3A6IDVweDtcbiAgfVxuICBmaWVsZHNldCB7XG4gICAgYm9yZGVyOiAxcHggc29saWQgI2VlZTtcbiAgICBib3JkZXItcmFkaXVzOiA1cHggNXB4IDVweCA1cHg7XG4gIH1cbiAgLmFjdGl2ZSB7XG4gICAgY29sb3I6ICMwMGY7XG4gIH1cbjwvc3R5bGU+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBZ0RFLGdEQUFxQixDQUNuQixPQUFPLENBQUUsSUFBSSxDQUNiLE9BQU8sQ0FBRSxHQUFHLENBQ1osYUFBYSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDeEIsVUFBVSxDQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQzFCLENBQ0Esa0NBQW9CLENBQUcsaUJBQUcsS0FBSyxZQUFZLENBQUUsQ0FDM0MsV0FBVyxDQUFFLEdBQUcsQ0FDaEIsVUFBVSxDQUFFLEdBQ2QsQ0FDQSxvQ0FBUyxDQUNQLE1BQU0sQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FDdEIsYUFBYSxDQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQzdCLENBQ0EsbUNBQVEsQ0FDTixLQUFLLENBQUUsSUFDVCJ9 */");
	}

	function get_each_context(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[5] = list[i].selector;
		child_ctx[6] = list[i].label;
		child_ctx[8] = i;
		return child_ctx;
	}

	// (21:6) {#each selections as { selector, label }
	function create_each_block(ctx) {
		let span;
		let label_1;
		let t0_value = /*label*/ ctx[6] + "";
		let t0;
		let t1;
		let input;
		let input_id_value;
		let input_title_value;
		let input_value_value;
		let t2;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				span = element("span");
				label_1 = element("label");
				t0 = text(t0_value);
				t1 = space();
				input = element("input");
				t2 = space();
				attr_dev(input, "type", "radio");
				attr_dev(input, "name", "selection");
				attr_dev(input, "id", input_id_value = /*selector*/ ctx[5]);
				attr_dev(input, "title", input_title_value = /*selector*/ ctx[5]);
				input.value = input_value_value = /*selector*/ ctx[5];
				add_location(input, file$5, 29, 12, 762);
				attr_dev(label_1, "class", "svelte-bz45mt");
				toggle_class(label_1, "active", /*current*/ ctx[1] === /*selector*/ ctx[5]);
				add_location(label_1, file$5, 27, 10, 686);
				attr_dev(span, "role", "button");
				attr_dev(span, "tabindex", "0");
				add_location(span, file$5, 21, 8, 523);
			},
			m: function mount(target, anchor) {
				insert_dev(target, span, anchor);
				append_dev(span, label_1);
				append_dev(label_1, t0);
				append_dev(label_1, t1);
				append_dev(label_1, input);
				append_dev(span, t2);

				if (!mounted) {
					dispose = [
						listen_dev(
							span,
							"keydown",
							function () {
								if (is_function(/*setSelection*/ ctx[3](/*selector*/ ctx[5]))) /*setSelection*/ ctx[3](/*selector*/ ctx[5]).apply(this, arguments);
							},
							false,
							false,
							false,
							false
						),
						listen_dev(
							span,
							"click",
							function () {
								if (is_function(/*setSelection*/ ctx[3](/*selector*/ ctx[5]))) /*setSelection*/ ctx[3](/*selector*/ ctx[5]).apply(this, arguments);
							},
							false,
							false,
							false,
							false
						)
					];

					mounted = true;
				}
			},
			p: function update(new_ctx, dirty) {
				ctx = new_ctx;
				if (dirty & /*selections*/ 1 && t0_value !== (t0_value = /*label*/ ctx[6] + "")) set_data_dev(t0, t0_value);

				if (dirty & /*selections*/ 1 && input_id_value !== (input_id_value = /*selector*/ ctx[5])) {
					attr_dev(input, "id", input_id_value);
				}

				if (dirty & /*selections*/ 1 && input_title_value !== (input_title_value = /*selector*/ ctx[5])) {
					attr_dev(input, "title", input_title_value);
				}

				if (dirty & /*selections*/ 1 && input_value_value !== (input_value_value = /*selector*/ ctx[5])) {
					prop_dev(input, "value", input_value_value);
				}

				if (dirty & /*current, selections*/ 3) {
					toggle_class(label_1, "active", /*current*/ ctx[1] === /*selector*/ ctx[5]);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(span);
				}

				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block.name,
			type: "each",
			source: "(21:6) {#each selections as { selector, label }",
			ctx
		});

		return block;
	}

	function create_fragment$5(ctx) {
		let div2;
		let div0;
		let fieldset;
		let t0;
		let div1;
		let t1;
		let t2_value = (/*current*/ ctx[1] ? /*current*/ ctx[1] : 'nothing') + "";
		let t2;
		let t3;
		let html_tag;
		let each_value = ensure_array_like_dev(/*selections*/ ctx[0]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		const block = {
			c: function create() {
				div2 = element("div");
				div0 = element("div");
				fieldset = element("fieldset");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t0 = space();
				div1 = element("div");
				t1 = text("The user selected ");
				t2 = text(t2_value);
				t3 = text(".\n    ");
				html_tag = new HtmlTag(false);
				attr_dev(fieldset, "class", "svelte-bz45mt");
				add_location(fieldset, file$5, 19, 4, 453);
				attr_dev(div0, "class", "svelte-bz45mt");
				add_location(div0, file$5, 18, 2, 443);
				html_tag.a = null;
				attr_dev(div1, "class", "svelte-bz45mt");
				add_location(div1, file$5, 41, 2, 1008);
				attr_dev(div2, "class", "selection-container svelte-bz45mt");
				add_location(div2, file$5, 17, 0, 407);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div2, anchor);
				append_dev(div2, div0);
				append_dev(div0, fieldset);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(fieldset, null);
					}
				}

				append_dev(div2, t0);
				append_dev(div2, div1);
				append_dev(div1, t1);
				append_dev(div1, t2);
				append_dev(div1, t3);
				html_tag.m(/*information*/ ctx[2], div1);
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*setSelection, selections, current*/ 11) {
					each_value = ensure_array_like_dev(/*selections*/ ctx[0]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(fieldset, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}

				if (dirty & /*current*/ 2 && t2_value !== (t2_value = (/*current*/ ctx[1] ? /*current*/ ctx[1] : 'nothing') + "")) set_data_dev(t2, t2_value);
				if (dirty & /*information*/ 4) html_tag.p(/*information*/ ctx[2]);
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div2);
				}

				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$5.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$5($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('RadioBoxes', slots, []);
		let { selections = [] } = $$props;
		const dispatch = createEventDispatcher();
		let current = '';
		let information = '<p>Nothing to display.</p>';

		const setSelection = selector => {
			$$invalidate(1, current = selector);
			const item = selections.find(o => o.selector === selector);
			$$invalidate(2, information = item.text);
			dispatch('select', { current });
		};

		const writable_props = ['selections'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<RadioBoxes> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('selections' in $$props) $$invalidate(0, selections = $$props.selections);
		};

		$$self.$capture_state = () => ({
			createEventDispatcher,
			selections,
			dispatch,
			current,
			information,
			setSelection
		});

		$$self.$inject_state = $$props => {
			if ('selections' in $$props) $$invalidate(0, selections = $$props.selections);
			if ('current' in $$props) $$invalidate(1, current = $$props.current);
			if ('information' in $$props) $$invalidate(2, information = $$props.information);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [selections, current, information, setSelection];
	}

	class RadioBoxes extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$5, create_fragment$5, safe_not_equal, { selections: 0 }, add_css$5);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "RadioBoxes",
				options,
				id: create_fragment$5.name
			});
		}

		get selections() {
			throw new Error("<RadioBoxes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set selections(value) {
			throw new Error("<RadioBoxes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/Contenteditable.svelte generated by Svelte v4.2.17 */
	const file$4 = "src/components/Contenteditable.svelte";

	function add_css$4(target) {
		append_styles(target, "svelte-1yv2dil", ".contentBox.svelte-1yv2dil{margin:7px 0px 7px 0px;padding:5px;border-radius:5px 5px 5px 5px;box-shadow:2px 2px 3px #eee}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29udGVudGVkaXRhYmxlLnN2ZWx0ZSIsInNvdXJjZXMiOlsiQ29udGVudGVkaXRhYmxlLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIgfSBmcm9tICdzdmVsdGUnXG5cbiAgZXhwb3J0IGxldCBjb250ZW50ID0gJydcblxuICBjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpXG5cbiAgY29uc3Qga2V5cHJlc3MgPSAoKSA9PiBkaXNwYXRjaCgnaW5wdXQnLCB7IGlucHV0OiBjb250ZW50IH0pXG48L3NjcmlwdD5cblxuPGRpdlxuICBjbGFzcz1cImNvbnRlbnRCb3hcIlxuICBjb250ZW50ZWRpdGFibGU9XCJ0cnVlXCJcbiAgYmluZDp0ZXh0Q29udGVudD17Y29udGVudH1cbiAgb246a2V5dXA9e2tleXByZXNzfVxuICByb2xlPVwiYnV0dG9uXCJcbiAgdGFiaW5kZXg9XCIwXCJcbi8+XG5cbjxzdHlsZT5cbiAgLmNvbnRlbnRCb3gge1xuICAgIG1hcmdpbjogN3B4IDBweCA3cHggMHB4O1xuICAgIHBhZGRpbmc6IDVweDtcbiAgICBib3JkZXItcmFkaXVzOiA1cHggNXB4IDVweCA1cHg7XG4gICAgYm94LXNoYWRvdzogMnB4IDJweCAzcHggI2VlZTtcbiAgfVxuPC9zdHlsZT5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFvQkUsMEJBQVksQ0FDVixNQUFNLENBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUN2QixPQUFPLENBQUUsR0FBRyxDQUNaLGFBQWEsQ0FBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQzlCLFVBQVUsQ0FBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUMxQiJ9 */");
	}

	function create_fragment$4(ctx) {
		let div;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				div = element("div");
				attr_dev(div, "class", "contentBox svelte-1yv2dil");
				attr_dev(div, "contenteditable", "true");
				attr_dev(div, "role", "button");
				attr_dev(div, "tabindex", "0");
				if (/*content*/ ctx[0] === void 0) add_render_callback(() => /*div_input_handler*/ ctx[2].call(div));
				add_location(div, file$4, 10, 0, 204);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);

				if (/*content*/ ctx[0] !== void 0) {
					div.textContent = /*content*/ ctx[0];
				}

				if (!mounted) {
					dispose = [
						listen_dev(div, "input", /*div_input_handler*/ ctx[2]),
						listen_dev(div, "keyup", /*keypress*/ ctx[1], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*content*/ 1 && /*content*/ ctx[0] !== div.textContent) {
					div.textContent = /*content*/ ctx[0];
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$4.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$4($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Contenteditable', slots, []);
		let { content = '' } = $$props;
		const dispatch = createEventDispatcher();
		const keypress = () => dispatch('input', { input: content });
		const writable_props = ['content'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Contenteditable> was created with unknown prop '${key}'`);
		});

		function div_input_handler() {
			content = this.textContent;
			$$invalidate(0, content);
		}

		$$self.$$set = $$props => {
			if ('content' in $$props) $$invalidate(0, content = $$props.content);
		};

		$$self.$capture_state = () => ({
			createEventDispatcher,
			content,
			dispatch,
			keypress
		});

		$$self.$inject_state = $$props => {
			if ('content' in $$props) $$invalidate(0, content = $$props.content);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [content, keypress, div_input_handler];
	}

	class Contenteditable extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$4, create_fragment$4, safe_not_equal, { content: 0 }, add_css$4);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Contenteditable",
				options,
				id: create_fragment$4.name
			});
		}

		get content() {
			throw new Error("<Contenteditable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set content(value) {
			throw new Error("<Contenteditable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/Profile.svelte generated by Svelte v4.2.17 */
	const file$3 = "src/components/Profile.svelte";

	function add_css$3(target) {
		append_styles(target, "svelte-jbubou", ".columns.svelte-jbubou.svelte-jbubou{display:flex;padding:5px;margin-top:5px;border:1px solid #eee;border-radius:5px 5px 5px 5px}.columns.svelte-jbubou div div.svelte-jbubou{margin-top:5px;margin-left:7px}img.svelte-jbubou.svelte-jbubou{margin-top:2px;margin-left:2px;border:1px solid #bbb;box-shadow:2px 2px 3px #eee}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJvZmlsZS5zdmVsdGUiLCJzb3VyY2VzIjpbIlByb2ZpbGUuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnXG4gIGltcG9ydCB7IGZhZGUgfSBmcm9tICdzdmVsdGUvdHJhbnNpdGlvbidcblxuICBsZXQgbmFtZVxuICBsZXQgZW1haWxcbiAgbGV0IG5hbWVPcmdcbiAgbGV0IGVtYWlsT3JnXG4gIGxldCB0aHVtYm5haWxcbiAgbGV0IHZpc2libGUgPSBmYWxzZVxuICBjb25zdCBtYXhsZW5ndGggPSAyN1xuXG4gIGNvbnN0IHNob3J0ZW5TdHJpbmcgPSAoc3RyLCBtYXhsZW5ndGgpID0+IHtcbiAgICByZXR1cm4gc3RyLmxlbmd0aCA+IG1heGxlbmd0aFxuICAgICAgPyBzdHIuc3Vic3RyaW5nKDAsIG1heGxlbmd0aCAtIDMpICsgJy4uLidcbiAgICAgIDogc3RyXG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBsb2FkRGF0YSgpIHtcbiAgICBsZXQgdXNlckRhdGEgPSBhd2FpdCBmZXRjaChgaHR0cHM6Ly9yYW5kb211c2VyLm1lL2FwaS9gKS50aGVuKChyKSA9PlxuICAgICAgci5qc29uKClcbiAgICApXG4gICAgbmFtZU9yZyA9IGAke3VzZXJEYXRhLnJlc3VsdHNbMF0ubmFtZS50aXRsZX0gJHt1c2VyRGF0YS5yZXN1bHRzWzBdLm5hbWUuZmlyc3R9ICR7dXNlckRhdGEucmVzdWx0c1swXS5uYW1lLmxhc3R9YFxuICAgIGVtYWlsT3JnID0gdXNlckRhdGEucmVzdWx0c1swXS5lbWFpbFxuICAgIG5hbWUgPSBzaG9ydGVuU3RyaW5nKG5hbWVPcmcsIG1heGxlbmd0aClcbiAgICBlbWFpbCA9IHNob3J0ZW5TdHJpbmcoZW1haWxPcmcsIG1heGxlbmd0aClcbiAgICB0aHVtYm5haWwgPSB1c2VyRGF0YS5yZXN1bHRzWzBdLnBpY3R1cmUubWVkaXVtXG4gICAgdmlzaWJsZSA9IHRydWVcbiAgfVxuXG4gIG9uTW91bnQobG9hZERhdGEpXG48L3NjcmlwdD5cblxueyNpZiB2aXNpYmxlfVxuICA8ZGl2IGNsYXNzPVwiY29sdW1uc1wiIHRyYW5zaXRpb246ZmFkZT17eyBkZWxheTogMjUwLCBkdXJhdGlvbjogMzAwIH19PlxuICAgIDxkaXY+XG4gICAgICA8aW1nIHNyYz17dGh1bWJuYWlsfSBhbHQ9XCJcIiAvPlxuICAgIDwvZGl2PlxuICAgIDxkaXY+XG4gICAgICA8ZGl2IHRpdGxlPXtuYW1lT3JnfT57bmFtZX08L2Rpdj5cbiAgICAgIDxkaXYgdGl0bGU9e2VtYWlsT3JnfT57ZW1haWx9PC9kaXY+XG4gICAgPC9kaXY+XG4gIDwvZGl2Plxuey9pZn1cblxuPHN0eWxlPlxuICAuY29sdW1ucyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBwYWRkaW5nOiA1cHg7XG4gICAgbWFyZ2luLXRvcDogNXB4O1xuICAgIGJvcmRlcjogMXB4IHNvbGlkICNlZWU7XG4gICAgYm9yZGVyLXJhZGl1czogNXB4IDVweCA1cHggNXB4O1xuICB9XG4gIC5jb2x1bW5zIGRpdiBkaXYge1xuICAgIG1hcmdpbi10b3A6IDVweDtcbiAgICBtYXJnaW4tbGVmdDogN3B4O1xuICB9XG4gIGltZyB7XG4gICAgbWFyZ2luLXRvcDogMnB4O1xuICAgIG1hcmdpbi1sZWZ0OiAycHg7XG4gICAgYm9yZGVyOiAxcHggc29saWQgI2JiYjtcbiAgICBib3gtc2hhZG93OiAycHggMnB4IDNweCAjZWVlO1xuICB9XG48L3N0eWxlPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQThDRSxvQ0FBUyxDQUNQLE9BQU8sQ0FBRSxJQUFJLENBQ2IsT0FBTyxDQUFFLEdBQUcsQ0FDWixVQUFVLENBQUUsR0FBRyxDQUNmLE1BQU0sQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FDdEIsYUFBYSxDQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQzdCLENBQ0Esc0JBQVEsQ0FBQyxHQUFHLENBQUMsaUJBQUksQ0FDZixVQUFVLENBQUUsR0FBRyxDQUNmLFdBQVcsQ0FBRSxHQUNmLENBQ0EsK0JBQUksQ0FDRixVQUFVLENBQUUsR0FBRyxDQUNmLFdBQVcsQ0FBRSxHQUFHLENBQ2hCLE1BQU0sQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FDdEIsVUFBVSxDQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQzFCIn0= */");
	}

	// (34:0) {#if visible}
	function create_if_block$3(ctx) {
		let div4;
		let div0;
		let img;
		let img_src_value;
		let t0;
		let div3;
		let div1;
		let t1;
		let t2;
		let div2;
		let t3;
		let div4_transition;
		let current;

		const block = {
			c: function create() {
				div4 = element("div");
				div0 = element("div");
				img = element("img");
				t0 = space();
				div3 = element("div");
				div1 = element("div");
				t1 = text(/*name*/ ctx[0]);
				t2 = space();
				div2 = element("div");
				t3 = text(/*email*/ ctx[1]);
				if (!src_url_equal(img.src, img_src_value = /*thumbnail*/ ctx[4])) attr_dev(img, "src", img_src_value);
				attr_dev(img, "alt", "");
				attr_dev(img, "class", "svelte-jbubou");
				add_location(img, file$3, 36, 6, 929);
				attr_dev(div0, "class", "svelte-jbubou");
				add_location(div0, file$3, 35, 4, 917);
				attr_dev(div1, "title", /*nameOrg*/ ctx[2]);
				attr_dev(div1, "class", "svelte-jbubou");
				add_location(div1, file$3, 39, 6, 987);
				attr_dev(div2, "title", /*emailOrg*/ ctx[3]);
				attr_dev(div2, "class", "svelte-jbubou");
				add_location(div2, file$3, 40, 6, 1027);
				attr_dev(div3, "class", "svelte-jbubou");
				add_location(div3, file$3, 38, 4, 975);
				attr_dev(div4, "class", "columns svelte-jbubou");
				add_location(div4, file$3, 34, 2, 843);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div4, anchor);
				append_dev(div4, div0);
				append_dev(div0, img);
				append_dev(div4, t0);
				append_dev(div4, div3);
				append_dev(div3, div1);
				append_dev(div1, t1);
				append_dev(div3, t2);
				append_dev(div3, div2);
				append_dev(div2, t3);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (!current || dirty & /*thumbnail*/ 16 && !src_url_equal(img.src, img_src_value = /*thumbnail*/ ctx[4])) {
					attr_dev(img, "src", img_src_value);
				}

				if (!current || dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);

				if (!current || dirty & /*nameOrg*/ 4) {
					attr_dev(div1, "title", /*nameOrg*/ ctx[2]);
				}

				if (!current || dirty & /*email*/ 2) set_data_dev(t3, /*email*/ ctx[1]);

				if (!current || dirty & /*emailOrg*/ 8) {
					attr_dev(div2, "title", /*emailOrg*/ ctx[3]);
				}
			},
			i: function intro(local) {
				if (current) return;

				if (local) {
					add_render_callback(() => {
						if (!current) return;
						if (!div4_transition) div4_transition = create_bidirectional_transition(div4, fade, { delay: 250, duration: 300 }, true);
						div4_transition.run(1);
					});
				}

				current = true;
			},
			o: function outro(local) {
				if (local) {
					if (!div4_transition) div4_transition = create_bidirectional_transition(div4, fade, { delay: 250, duration: 300 }, false);
					div4_transition.run(0);
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div4);
				}

				if (detaching && div4_transition) div4_transition.end();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$3.name,
			type: "if",
			source: "(34:0) {#if visible}",
			ctx
		});

		return block;
	}

	function create_fragment$3(ctx) {
		let if_block_anchor;
		let if_block = /*visible*/ ctx[5] && create_if_block$3(ctx);

		const block = {
			c: function create() {
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
			},
			p: function update(ctx, [dirty]) {
				if (/*visible*/ ctx[5]) {
					if (if_block) {
						if_block.p(ctx, dirty);

						if (dirty & /*visible*/ 32) {
							transition_in(if_block, 1);
						}
					} else {
						if_block = create_if_block$3(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					group_outros();

					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});

					check_outros();
				}
			},
			i: function intro(local) {
				transition_in(if_block);
			},
			o: function outro(local) {
				transition_out(if_block);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if (if_block) if_block.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$3.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	const maxlength = 27;

	function instance$3($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Profile', slots, []);
		let name;
		let email;
		let nameOrg;
		let emailOrg;
		let thumbnail;
		let visible = false;

		const shortenString = (str, maxlength) => {
			return str.length > maxlength
			? str.substring(0, maxlength - 3) + '...'
			: str;
		};

		async function loadData() {
			let userData = await fetch(`https://randomuser.me/api/`).then(r => r.json());
			$$invalidate(2, nameOrg = `${userData.results[0].name.title} ${userData.results[0].name.first} ${userData.results[0].name.last}`);
			$$invalidate(3, emailOrg = userData.results[0].email);
			$$invalidate(0, name = shortenString(nameOrg, maxlength));
			$$invalidate(1, email = shortenString(emailOrg, maxlength));
			$$invalidate(4, thumbnail = userData.results[0].picture.medium);
			$$invalidate(5, visible = true);
		}

		onMount(loadData);
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Profile> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({
			onMount,
			fade,
			name,
			email,
			nameOrg,
			emailOrg,
			thumbnail,
			visible,
			maxlength,
			shortenString,
			loadData
		});

		$$self.$inject_state = $$props => {
			if ('name' in $$props) $$invalidate(0, name = $$props.name);
			if ('email' in $$props) $$invalidate(1, email = $$props.email);
			if ('nameOrg' in $$props) $$invalidate(2, nameOrg = $$props.nameOrg);
			if ('emailOrg' in $$props) $$invalidate(3, emailOrg = $$props.emailOrg);
			if ('thumbnail' in $$props) $$invalidate(4, thumbnail = $$props.thumbnail);
			if ('visible' in $$props) $$invalidate(5, visible = $$props.visible);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [name, email, nameOrg, emailOrg, thumbnail, visible];
	}

	class Profile extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$3, create_fragment$3, safe_not_equal, {}, add_css$3);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Profile",
				options,
				id: create_fragment$3.name
			});
		}
	}

	/* src/components/EventLog.svelte generated by Svelte v4.2.17 */
	const file$2 = "src/components/EventLog.svelte";

	function add_css$2(target) {
		append_styles(target, "svelte-16v21lz", "textarea.svelte-16v21lz{background-color:black;color:lightgray;font-size:0.7em;width:100%;height:100px;padding-bottom:20px;overflow-y:scroll}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXZlbnRMb2cuc3ZlbHRlIiwic291cmNlcyI6WyJFdmVudExvZy5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHN2ZWx0ZTpvcHRpb25zIGFjY2Vzc29ycz17dHJ1ZX0gLz5cblxuPHNjcmlwdD5cbiAgZXhwb3J0IGxldCBzaG93TG9ncyA9IGZhbHNlXG4gIGV4cG9ydCBsZXQgbG9ncyA9ICcnXG48L3NjcmlwdD5cblxueyNpZiBzaG93TG9nc31cbiAgPHRleHRhcmVhIGlkPVwiZXZlbnRMb2dcIj57bG9nc308L3RleHRhcmVhPlxuey9pZn1cblxuPHN0eWxlPlxuICB0ZXh0YXJlYSB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogYmxhY2s7XG4gICAgY29sb3I6IGxpZ2h0Z3JheTtcbiAgICBmb250LXNpemU6IDAuN2VtO1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIGhlaWdodDogMTAwcHg7XG4gICAgcGFkZGluZy1ib3R0b206IDIwcHg7XG4gICAgb3ZlcmZsb3cteTogc2Nyb2xsO1xuICB9XG48L3N0eWxlPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVlFLHVCQUFTLENBQ1AsZ0JBQWdCLENBQUUsS0FBSyxDQUN2QixLQUFLLENBQUUsU0FBUyxDQUNoQixTQUFTLENBQUUsS0FBSyxDQUNoQixLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxLQUFLLENBQ2IsY0FBYyxDQUFFLElBQUksQ0FDcEIsVUFBVSxDQUFFLE1BQ2QifQ== */");
	}

	// (8:0) {#if showLogs}
	function create_if_block$2(ctx) {
		let textarea;

		const block = {
			c: function create() {
				textarea = element("textarea");
				attr_dev(textarea, "id", "eventLog");
				textarea.value = /*logs*/ ctx[1];
				attr_dev(textarea, "class", "svelte-16v21lz");
				add_location(textarea, file$2, 8, 2, 127);
			},
			m: function mount(target, anchor) {
				insert_dev(target, textarea, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*logs*/ 2) {
					prop_dev(textarea, "value", /*logs*/ ctx[1]);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(textarea);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$2.name,
			type: "if",
			source: "(8:0) {#if showLogs}",
			ctx
		});

		return block;
	}

	function create_fragment$2(ctx) {
		let if_block_anchor;
		let if_block = /*showLogs*/ ctx[0] && create_if_block$2(ctx);

		const block = {
			c: function create() {
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
			},
			p: function update(ctx, [dirty]) {
				if (/*showLogs*/ ctx[0]) {
					if (if_block) {
						if_block.p(ctx, dirty);
					} else {
						if_block = create_if_block$2(ctx);
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if (if_block) if_block.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$2.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$2($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('EventLog', slots, []);
		let { showLogs = false } = $$props;
		let { logs = '' } = $$props;
		const writable_props = ['showLogs', 'logs'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<EventLog> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('showLogs' in $$props) $$invalidate(0, showLogs = $$props.showLogs);
			if ('logs' in $$props) $$invalidate(1, logs = $$props.logs);
		};

		$$self.$capture_state = () => ({ showLogs, logs });

		$$self.$inject_state = $$props => {
			if ('showLogs' in $$props) $$invalidate(0, showLogs = $$props.showLogs);
			if ('logs' in $$props) $$invalidate(1, logs = $$props.logs);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [showLogs, logs];
	}

	class EventLog extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$2, create_fragment$2, safe_not_equal, { showLogs: 0, logs: 1 }, add_css$2);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "EventLog",
				options,
				id: create_fragment$2.name
			});
		}

		get showLogs() {
			return this.$$.ctx[0];
		}

		set showLogs(showLogs) {
			this.$$set({ showLogs });
			flush();
		}

		get logs() {
			return this.$$.ctx[1];
		}

		set logs(logs) {
			this.$$set({ logs });
			flush();
		}
	}

	/* src/components/Animation.svelte generated by Svelte v4.2.17 */
	const file$1 = "src/components/Animation.svelte";

	function add_css$1(target) {
		append_styles(target, "svelte-1kmbq2b", ".animation-container.svelte-1kmbq2b{margin:10px}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQW5pbWF0aW9uLnN2ZWx0ZSIsInNvdXJjZXMiOlsiQW5pbWF0aW9uLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBmYWRlLCBibHVyLCBmbHksIHNsaWRlLCBzY2FsZSB9IGZyb20gJ3N2ZWx0ZS90cmFuc2l0aW9uJ1xuXG4gIGxldCBhbmltYXRlID0gZmFsc2Vcbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwiYW5pbWF0aW9uLWNvbnRhaW5lclwiPlxuICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgYmluZDpjaGVja2VkPXthbmltYXRlfSAvPiBTaG93IFRyYW5zaXRpb25zXG4gIHsjaWYgYW5pbWF0ZX1cbiAgICA8ZGl2IHRyYW5zaXRpb246ZmFkZT5UaGlzIHRleHQgdXNlIHRyYW5zaXRpb246ZmFkZS48L2Rpdj5cbiAgICA8ZGl2IHRyYW5zaXRpb246Ymx1cj5UaGlzIHRleHQgdXNlIHRyYW5zaXRpb246Ymx1ci48L2Rpdj5cbiAgICA8ZGl2IHRyYW5zaXRpb246Zmx5PXt7IHg6IDEwIH19PlRoaXMgdGV4dCB1c2UgdHJhbnNpdGlvbjpmbHkuPC9kaXY+XG4gICAgPGRpdiB0cmFuc2l0aW9uOnNsaWRlPlRoaXMgdGV4dCB1c2UgdHJhbnNpdGlvbjpzbGlkZS48L2Rpdj5cbiAgICA8ZGl2IHRyYW5zaXRpb246c2NhbGU9e3sgc3RhcnQ6IDUgfX0+VGhpcyB0ZXh0IHVzZSB0cmFuc2l0aW9uOnNjYWxlLjwvZGl2PlxuICB7L2lmfVxuPC9kaXY+XG5cbjxzdHlsZT5cbiAgLmFuaW1hdGlvbi1jb250YWluZXIge1xuICAgIG1hcmdpbjogMTBweDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFrQkUsbUNBQXFCLENBQ25CLE1BQU0sQ0FBRSxJQUNWIn0= */");
	}

	// (9:2) {#if animate}
	function create_if_block$1(ctx) {
		let div0;
		let div0_transition;
		let t1;
		let div1;
		let div1_transition;
		let t3;
		let div2;
		let div2_transition;
		let t5;
		let div3;
		let div3_transition;
		let t7;
		let div4;
		let div4_transition;
		let current;

		const block = {
			c: function create() {
				div0 = element("div");
				div0.textContent = "This text use transition:fade.";
				t1 = space();
				div1 = element("div");
				div1.textContent = "This text use transition:blur.";
				t3 = space();
				div2 = element("div");
				div2.textContent = "This text use transition:fly.";
				t5 = space();
				div3 = element("div");
				div3.textContent = "This text use transition:slide.";
				t7 = space();
				div4 = element("div");
				div4.textContent = "This text use transition:scale.";
				add_location(div0, file$1, 9, 4, 233);
				add_location(div1, file$1, 10, 4, 295);
				add_location(div2, file$1, 11, 4, 357);
				add_location(div3, file$1, 12, 4, 429);
				add_location(div4, file$1, 13, 4, 493);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div0, anchor);
				insert_dev(target, t1, anchor);
				insert_dev(target, div1, anchor);
				insert_dev(target, t3, anchor);
				insert_dev(target, div2, anchor);
				insert_dev(target, t5, anchor);
				insert_dev(target, div3, anchor);
				insert_dev(target, t7, anchor);
				insert_dev(target, div4, anchor);
				current = true;
			},
			i: function intro(local) {
				if (current) return;

				if (local) {
					add_render_callback(() => {
						if (!current) return;
						if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, {}, true);
						div0_transition.run(1);
					});
				}

				if (local) {
					add_render_callback(() => {
						if (!current) return;
						if (!div1_transition) div1_transition = create_bidirectional_transition(div1, blur, {}, true);
						div1_transition.run(1);
					});
				}

				if (local) {
					add_render_callback(() => {
						if (!current) return;
						if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fly, { x: 10 }, true);
						div2_transition.run(1);
					});
				}

				if (local) {
					add_render_callback(() => {
						if (!current) return;
						if (!div3_transition) div3_transition = create_bidirectional_transition(div3, slide, {}, true);
						div3_transition.run(1);
					});
				}

				if (local) {
					add_render_callback(() => {
						if (!current) return;
						if (!div4_transition) div4_transition = create_bidirectional_transition(div4, scale, { start: 5 }, true);
						div4_transition.run(1);
					});
				}

				current = true;
			},
			o: function outro(local) {
				if (local) {
					if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, {}, false);
					div0_transition.run(0);
				}

				if (local) {
					if (!div1_transition) div1_transition = create_bidirectional_transition(div1, blur, {}, false);
					div1_transition.run(0);
				}

				if (local) {
					if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fly, { x: 10 }, false);
					div2_transition.run(0);
				}

				if (local) {
					if (!div3_transition) div3_transition = create_bidirectional_transition(div3, slide, {}, false);
					div3_transition.run(0);
				}

				if (local) {
					if (!div4_transition) div4_transition = create_bidirectional_transition(div4, scale, { start: 5 }, false);
					div4_transition.run(0);
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div0);
					detach_dev(t1);
					detach_dev(div1);
					detach_dev(t3);
					detach_dev(div2);
					detach_dev(t5);
					detach_dev(div3);
					detach_dev(t7);
					detach_dev(div4);
				}

				if (detaching && div0_transition) div0_transition.end();
				if (detaching && div1_transition) div1_transition.end();
				if (detaching && div2_transition) div2_transition.end();
				if (detaching && div3_transition) div3_transition.end();
				if (detaching && div4_transition) div4_transition.end();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$1.name,
			type: "if",
			source: "(9:2) {#if animate}",
			ctx
		});

		return block;
	}

	function create_fragment$1(ctx) {
		let div;
		let input;
		let t;
		let mounted;
		let dispose;
		let if_block = /*animate*/ ctx[0] && create_if_block$1(ctx);

		const block = {
			c: function create() {
				div = element("div");
				input = element("input");
				t = text(" Show Transitions\n  ");
				if (if_block) if_block.c();
				attr_dev(input, "type", "checkbox");
				add_location(input, file$1, 7, 2, 147);
				attr_dev(div, "class", "animation-container svelte-1kmbq2b");
				add_location(div, file$1, 6, 0, 111);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, input);
				input.checked = /*animate*/ ctx[0];
				append_dev(div, t);
				if (if_block) if_block.m(div, null);

				if (!mounted) {
					dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[1]);
					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*animate*/ 1) {
					input.checked = /*animate*/ ctx[0];
				}

				if (/*animate*/ ctx[0]) {
					if (if_block) {
						if (dirty & /*animate*/ 1) {
							transition_in(if_block, 1);
						}
					} else {
						if_block = create_if_block$1(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(div, null);
					}
				} else if (if_block) {
					group_outros();

					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});

					check_outros();
				}
			},
			i: function intro(local) {
				transition_in(if_block);
			},
			o: function outro(local) {
				transition_out(if_block);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if (if_block) if_block.d();
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$1.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$1($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Animation', slots, []);
		let animate = false;
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Animation> was created with unknown prop '${key}'`);
		});

		function input_change_handler() {
			animate = this.checked;
			$$invalidate(0, animate);
		}

		$$self.$capture_state = () => ({ fade, blur, fly, slide, scale, animate });

		$$self.$inject_state = $$props => {
			if ('animate' in $$props) $$invalidate(0, animate = $$props.animate);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [animate, input_change_handler];
	}

	class Animation extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$1, safe_not_equal, {}, add_css$1);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Animation",
				options,
				id: create_fragment$1.name
			});
		}
	}

	/* src/App.svelte generated by Svelte v4.2.17 */
	const file = "src/App.svelte";

	function add_css(target) {
		append_styles(target, "svelte-1plrz5d", "#container.svelte-1plrz5d.svelte-1plrz5d{height:90%;width:75%;padding:2% 2% 3% 3%;margin:0 auto;border:1px solid #eee;border-radius:5px 5px 5px 5px}.columns.svelte-1plrz5d.svelte-1plrz5d{display:flex;flex-wrap:wrap;padding:3px}.columns.svelte-1plrz5d>.svelte-1plrz5d{flex-grow:1;flex-shrink:1;flex-basis:300px}.columns.svelte-1plrz5d .left-column.svelte-1plrz5d{padding:1% 1% 2% 2%}.columns.svelte-1plrz5d .right-column.svelte-1plrz5d{padding:1% 1% 2% 2%}.footer.svelte-1plrz5d.svelte-1plrz5d{margin:7px;font-size:10px}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwLnN2ZWx0ZSIsInNvdXJjZXMiOlsiQXBwLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c3ZlbHRlOm9wdGlvbnMgYWNjZXNzb3JzPXt0cnVlfSAvPlxuXG48c2NyaXB0PlxuICBpbXBvcnQgeyBlbGFwc2VkIH0gZnJvbSAnLi9zdG9yZXMuanMnXG4gIGltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJ3N2ZWx0ZSdcblxuICBpbXBvcnQgSGVhZGxpbmUgZnJvbSAnLi9jb21wb25lbnRzL0hlYWRsaW5lLnN2ZWx0ZSdcbiAgaW1wb3J0IExpc3QgZnJvbSAnLi9jb21wb25lbnRzL0xpc3Quc3ZlbHRlJ1xuICBpbXBvcnQgVGFibGUgZnJvbSAnLi9jb21wb25lbnRzL1RhYmxlLnN2ZWx0ZSdcbiAgaW1wb3J0IE1vZGFsRGlhbG9nIGZyb20gJy4vY29tcG9uZW50cy9Nb2RhbERpYWxvZy5zdmVsdGUnXG4gIGltcG9ydCBNb2RhbEZvcm0gZnJvbSAnLi9jb21wb25lbnRzL01vZGFsRm9ybS5zdmVsdGUnXG4gIGltcG9ydCBVc2VySW5wdXQgZnJvbSAnLi9jb21wb25lbnRzL1VzZXJJbnB1dC5zdmVsdGUnXG4gIGltcG9ydCBSYWRpb0JveGVzIGZyb20gJy4vY29tcG9uZW50cy9SYWRpb0JveGVzLnN2ZWx0ZSdcbiAgaW1wb3J0IENvbnRlbnRlZGl0YWJsZSBmcm9tICcuL2NvbXBvbmVudHMvQ29udGVudGVkaXRhYmxlLnN2ZWx0ZSdcbiAgaW1wb3J0IFByb2ZpbGUgZnJvbSAnLi9jb21wb25lbnRzL1Byb2ZpbGUuc3ZlbHRlJ1xuICBpbXBvcnQgRXZlbnRMb2cgZnJvbSAnLi9jb21wb25lbnRzL0V2ZW50TG9nLnN2ZWx0ZSdcbiAgaW1wb3J0IEFuaW1hdGlvbiBmcm9tICcuL2NvbXBvbmVudHMvQW5pbWF0aW9uLnN2ZWx0ZSdcblxuICBleHBvcnQgbGV0IG1lc3NhZ2UsIGl0ZW1JZFxuICBleHBvcnQgbGV0IGxpc3QsIGN1cnJlbnRJdGVtXG4gIGV4cG9ydCBsZXQgdGFibGVcbiAgZXhwb3J0IGxldCB1c2VySW5wdXRcbiAgZXhwb3J0IGxldCBzZWxlY3Rpb25zXG4gIGV4cG9ydCBsZXQgbW9kYWxEaWFsb2dcbiAgZXhwb3J0IGxldCBzaG93Rm9ybU1vZGFsLFxuICAgIHZhbHVlTmFtZSA9ICcnLFxuICAgIHZhbHVlVXJsID0gJydcbiAgZXhwb3J0IGxldCBzZWxlY3RlZCA9ICcnXG4gIGV4cG9ydCBsZXQgc2hvd0xvZ3MgPSB0cnVlLFxuICAgIGxvZ3MgPSAnJ1xuXG4gIC8vIGV2ZW50IGhhbmRsaW5nXG4gIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKClcbiAgY29uc3QgbGlzdFNlbGVjdGlvbiA9IChldmVudCkgPT4gZGlzcGF0Y2goJ2xpc3RTZWxlY3Rpb24nLCBldmVudC5kZXRhaWwuaXRlbSlcbiAgY29uc3QgaGFuZGxlQ2xpY2tlZFJvdyA9IChldmVudCkgPT4gZGlzcGF0Y2goJ2hhbmRsZUNsaWNrZWRSb3cnLCBldmVudC5kZXRhaWwpXG4gIGNvbnN0IHNlbmRGb3JtID0gKGV2ZW50KSA9PiBkaXNwYXRjaCgnc2VuZEZvcm0nLCBldmVudC5kZXRhaWwpXG4gIGNvbnN0IGhhbmRsZUV2ZW50ID0gKGV2ZW50KSA9PiBkaXNwYXRjaCgnaGFuZGxlRXZlbnQnLCBldmVudC5kZXRhaWwpXG4gIGNvbnN0IGhhbmRsZVVzZXJFdmVudCA9IChldmVudCkgPT4gZGlzcGF0Y2goJ2hhbmRsZVVzZXJFdmVudCcsIGV2ZW50LmRldGFpbClcbjwvc2NyaXB0PlxuXG48ZGl2IGlkPVwiY29udGFpbmVyXCI+XG4gIDxkaXY+XG4gICAgPEhlYWRsaW5lIHttZXNzYWdlfSB7aXRlbUlkfSAvPlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNvbHVtbnNcIj5cbiAgICA8ZGl2IGNsYXNzPVwibGVmdC1jb2x1bW5cIj5cbiAgICAgIDxMaXN0IHtsaXN0fSB7Y3VycmVudEl0ZW19IG9uOnNlbGVjdD17bGlzdFNlbGVjdGlvbn0gb246ZWRpdCAvPlxuXG4gICAgICA8VXNlcklucHV0IHt1c2VySW5wdXR9IG9uOmlucHV0IC8+XG5cbiAgICAgIDxDb250ZW50ZWRpdGFibGUgY29udGVudD1cIlRoaXMgY29udGVudCBpcyBlZGl0YWJsZS5cIiBvbjppbnB1dCAvPlxuXG4gICAgICA8TW9kYWxEaWFsb2cgey4uLm1vZGFsRGlhbG9nfSBvbjpjbG9zZSAvPlxuXG4gICAgICA8QW5pbWF0aW9uIC8+XG5cbiAgICAgIDxNb2RhbEZvcm1cbiAgICAgICAgc2hvd01vZGFsPXtzaG93Rm9ybU1vZGFsfVxuICAgICAgICB7dmFsdWVOYW1lfVxuICAgICAgICB7dmFsdWVVcmx9XG4gICAgICAgIG9uOnNlbmRGb3JtPXtzZW5kRm9ybX1cbiAgICAgICAgb246Y2xvc2VcbiAgICAgIC8+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cInJpZ2h0LWNvbHVtblwiPlxuICAgICAgPFRhYmxlIHtzZWxlY3RlZH0gZGF0YT17dGFibGV9IG9uOmNsaWNrZWRSb3c9e2hhbmRsZUNsaWNrZWRSb3d9IC8+XG5cbiAgICAgIDxSYWRpb0JveGVzIHtzZWxlY3Rpb25zfSBvbjpzZWxlY3Q9e2hhbmRsZUV2ZW50fSAvPlxuXG4gICAgICA8UHJvZmlsZSAvPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImZvb3RlclwiPlxuICAgIDxkaXY+XG4gICAgICB7I2lmICRlbGFwc2VkfVxuICAgICAgICBUaGUgdXNlciBpcyBpbmFjdGl2ZSBmb3IgeyRlbGFwc2VkfVxuICAgICAgICB7JGVsYXBzZWQgPT09IDEgPyAnc2Vjb25kJyA6ICdzZWNvbmRzJ31cbiAgICAgIHs6ZWxzZX1cbiAgICAgICAgVGhlIHVzZXIgaXMgYWN0aXZlXG4gICAgICB7L2lmfVxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbiAgPEV2ZW50TG9nIHtzaG93TG9nc30ge2xvZ3N9IC8+XG48L2Rpdj5cblxuPHN2ZWx0ZTp3aW5kb3dcbiAgb246bW91c2Vtb3ZlPXtoYW5kbGVVc2VyRXZlbnR9XG4gIG9uOmNsaWNrPXtoYW5kbGVVc2VyRXZlbnR9XG4gIG9uOmtleWRvd249e2hhbmRsZVVzZXJFdmVudH1cbi8+XG5cbjxzdHlsZT5cbiAgI2NvbnRhaW5lciB7XG4gICAgaGVpZ2h0OiA5MCU7XG4gICAgd2lkdGg6IDc1JTtcbiAgICBwYWRkaW5nOiAyJSAyJSAzJSAzJTtcbiAgICBtYXJnaW46IDAgYXV0bztcbiAgICBib3JkZXI6IDFweCBzb2xpZCAjZWVlO1xuICAgIGJvcmRlci1yYWRpdXM6IDVweCA1cHggNXB4IDVweDtcbiAgfVxuICAuY29sdW1ucyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgcGFkZGluZzogM3B4O1xuICB9XG4gIC5jb2x1bW5zID4gKiB7XG4gICAgZmxleC1ncm93OiAxO1xuICAgIGZsZXgtc2hyaW5rOiAxO1xuICAgIGZsZXgtYmFzaXM6IDMwMHB4O1xuICB9XG4gIC5jb2x1bW5zIC5sZWZ0LWNvbHVtbiB7XG4gICAgcGFkZGluZzogMSUgMSUgMiUgMiU7XG4gIH1cbiAgLmNvbHVtbnMgLnJpZ2h0LWNvbHVtbiB7XG4gICAgcGFkZGluZzogMSUgMSUgMiUgMiU7XG4gIH1cbiAgLmZvb3RlciB7XG4gICAgbWFyZ2luOiA3cHg7XG4gICAgZm9udC1zaXplOiAxMHB4O1xuICB9XG48L3N0eWxlPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTRGRSx3Q0FBVyxDQUNULE1BQU0sQ0FBRSxHQUFHLENBQ1gsS0FBSyxDQUFFLEdBQUcsQ0FDVixPQUFPLENBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUNwQixNQUFNLENBQUUsQ0FBQyxDQUFDLElBQUksQ0FDZCxNQUFNLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQ3RCLGFBQWEsQ0FBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUM3QixDQUNBLHNDQUFTLENBQ1AsT0FBTyxDQUFFLElBQUksQ0FDYixTQUFTLENBQUUsSUFBSSxDQUNmLE9BQU8sQ0FBRSxHQUNYLENBQ0EsdUJBQVEsQ0FBRyxlQUFFLENBQ1gsU0FBUyxDQUFFLENBQUMsQ0FDWixXQUFXLENBQUUsQ0FBQyxDQUNkLFVBQVUsQ0FBRSxLQUNkLENBQ0EsdUJBQVEsQ0FBQywyQkFBYSxDQUNwQixPQUFPLENBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDcEIsQ0FDQSx1QkFBUSxDQUFDLDRCQUFjLENBQ3JCLE9BQU8sQ0FBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNwQixDQUNBLHFDQUFRLENBQ04sTUFBTSxDQUFFLEdBQUcsQ0FDWCxTQUFTLENBQUUsSUFDYiJ9 */");
	}

	// (78:6) {:else}
	function create_else_block(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text("The user is active");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block.name,
			type: "else",
			source: "(78:6) {:else}",
			ctx
		});

		return block;
	}

	// (75:6) {#if $elapsed}
	function create_if_block(ctx) {
		let t0;
		let t1;
		let t2;
		let t3_value = (/*$elapsed*/ ctx[14] === 1 ? 'second' : 'seconds') + "";
		let t3;

		const block = {
			c: function create() {
				t0 = text("The user is inactive for ");
				t1 = text(/*$elapsed*/ ctx[14]);
				t2 = space();
				t3 = text(t3_value);
			},
			m: function mount(target, anchor) {
				insert_dev(target, t0, anchor);
				insert_dev(target, t1, anchor);
				insert_dev(target, t2, anchor);
				insert_dev(target, t3, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*$elapsed*/ 16384) set_data_dev(t1, /*$elapsed*/ ctx[14]);
				if (dirty & /*$elapsed*/ 16384 && t3_value !== (t3_value = (/*$elapsed*/ ctx[14] === 1 ? 'second' : 'seconds') + "")) set_data_dev(t3, t3_value);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(t1);
					detach_dev(t2);
					detach_dev(t3);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block.name,
			type: "if",
			source: "(75:6) {#if $elapsed}",
			ctx
		});

		return block;
	}

	function create_fragment(ctx) {
		let div6;
		let div0;
		let headline;
		let t0;
		let div3;
		let div1;
		let list_1;
		let t1;
		let userinput;
		let t2;
		let contenteditable;
		let t3;
		let modaldialog;
		let t4;
		let animation;
		let t5;
		let modalform;
		let t6;
		let div2;
		let table_1;
		let t7;
		let radioboxes;
		let t8;
		let profile;
		let t9;
		let div5;
		let div4;
		let t10;
		let eventlog;
		let current;
		let mounted;
		let dispose;

		headline = new Headline({
				props: {
					message: /*message*/ ctx[0],
					itemId: /*itemId*/ ctx[1]
				},
				$$inline: true
			});

		list_1 = new List({
				props: {
					list: /*list*/ ctx[2],
					currentItem: /*currentItem*/ ctx[3]
				},
				$$inline: true
			});

		list_1.$on("select", /*listSelection*/ ctx[15]);
		list_1.$on("edit", /*edit_handler*/ ctx[20]);

		userinput = new UserInput({
				props: { userInput: /*userInput*/ ctx[5] },
				$$inline: true
			});

		userinput.$on("input", /*input_handler*/ ctx[21]);

		contenteditable = new Contenteditable({
				props: { content: "This content is editable." },
				$$inline: true
			});

		contenteditable.$on("input", /*input_handler_1*/ ctx[22]);
		const modaldialog_spread_levels = [/*modalDialog*/ ctx[7]];
		let modaldialog_props = {};

		for (let i = 0; i < modaldialog_spread_levels.length; i += 1) {
			modaldialog_props = assign(modaldialog_props, modaldialog_spread_levels[i]);
		}

		modaldialog = new ModalDialog({ props: modaldialog_props, $$inline: true });
		modaldialog.$on("close", /*close_handler*/ ctx[23]);
		animation = new Animation({ $$inline: true });

		modalform = new ModalForm({
				props: {
					showModal: /*showFormModal*/ ctx[8],
					valueName: /*valueName*/ ctx[9],
					valueUrl: /*valueUrl*/ ctx[10]
				},
				$$inline: true
			});

		modalform.$on("sendForm", /*sendForm*/ ctx[17]);
		modalform.$on("close", /*close_handler_1*/ ctx[24]);

		table_1 = new Table({
				props: {
					selected: /*selected*/ ctx[11],
					data: /*table*/ ctx[4]
				},
				$$inline: true
			});

		table_1.$on("clickedRow", /*handleClickedRow*/ ctx[16]);

		radioboxes = new RadioBoxes({
				props: { selections: /*selections*/ ctx[6] },
				$$inline: true
			});

		radioboxes.$on("select", /*handleEvent*/ ctx[18]);
		profile = new Profile({ $$inline: true });

		function select_block_type(ctx, dirty) {
			if (/*$elapsed*/ ctx[14]) return create_if_block;
			return create_else_block;
		}

		let current_block_type = select_block_type(ctx);
		let if_block = current_block_type(ctx);

		eventlog = new EventLog({
				props: {
					showLogs: /*showLogs*/ ctx[12],
					logs: /*logs*/ ctx[13]
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				div6 = element("div");
				div0 = element("div");
				create_component(headline.$$.fragment);
				t0 = space();
				div3 = element("div");
				div1 = element("div");
				create_component(list_1.$$.fragment);
				t1 = space();
				create_component(userinput.$$.fragment);
				t2 = space();
				create_component(contenteditable.$$.fragment);
				t3 = space();
				create_component(modaldialog.$$.fragment);
				t4 = space();
				create_component(animation.$$.fragment);
				t5 = space();
				create_component(modalform.$$.fragment);
				t6 = space();
				div2 = element("div");
				create_component(table_1.$$.fragment);
				t7 = space();
				create_component(radioboxes.$$.fragment);
				t8 = space();
				create_component(profile.$$.fragment);
				t9 = space();
				div5 = element("div");
				div4 = element("div");
				if_block.c();
				t10 = space();
				create_component(eventlog.$$.fragment);
				add_location(div0, file, 41, 2, 1507);
				attr_dev(div1, "class", "left-column svelte-1plrz5d");
				add_location(div1, file, 45, 4, 1586);
				attr_dev(div2, "class", "right-column svelte-1plrz5d");
				add_location(div2, file, 64, 4, 2029);
				attr_dev(div3, "class", "columns svelte-1plrz5d");
				add_location(div3, file, 44, 2, 1560);
				add_location(div4, file, 73, 4, 2254);
				attr_dev(div5, "class", "footer svelte-1plrz5d");
				add_location(div5, file, 72, 2, 2229);
				attr_dev(div6, "id", "container");
				attr_dev(div6, "class", "svelte-1plrz5d");
				add_location(div6, file, 40, 0, 1484);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div6, anchor);
				append_dev(div6, div0);
				mount_component(headline, div0, null);
				append_dev(div6, t0);
				append_dev(div6, div3);
				append_dev(div3, div1);
				mount_component(list_1, div1, null);
				append_dev(div1, t1);
				mount_component(userinput, div1, null);
				append_dev(div1, t2);
				mount_component(contenteditable, div1, null);
				append_dev(div1, t3);
				mount_component(modaldialog, div1, null);
				append_dev(div1, t4);
				mount_component(animation, div1, null);
				append_dev(div1, t5);
				mount_component(modalform, div1, null);
				append_dev(div3, t6);
				append_dev(div3, div2);
				mount_component(table_1, div2, null);
				append_dev(div2, t7);
				mount_component(radioboxes, div2, null);
				append_dev(div2, t8);
				mount_component(profile, div2, null);
				append_dev(div6, t9);
				append_dev(div6, div5);
				append_dev(div5, div4);
				if_block.m(div4, null);
				append_dev(div6, t10);
				mount_component(eventlog, div6, null);
				current = true;

				if (!mounted) {
					dispose = [
						listen_dev(window, "mousemove", /*handleUserEvent*/ ctx[19], false, false, false, false),
						listen_dev(window, "click", /*handleUserEvent*/ ctx[19], false, false, false, false),
						listen_dev(window, "keydown", /*handleUserEvent*/ ctx[19], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				const headline_changes = {};
				if (dirty & /*message*/ 1) headline_changes.message = /*message*/ ctx[0];
				if (dirty & /*itemId*/ 2) headline_changes.itemId = /*itemId*/ ctx[1];
				headline.$set(headline_changes);
				const list_1_changes = {};
				if (dirty & /*list*/ 4) list_1_changes.list = /*list*/ ctx[2];
				if (dirty & /*currentItem*/ 8) list_1_changes.currentItem = /*currentItem*/ ctx[3];
				list_1.$set(list_1_changes);
				const userinput_changes = {};
				if (dirty & /*userInput*/ 32) userinput_changes.userInput = /*userInput*/ ctx[5];
				userinput.$set(userinput_changes);

				const modaldialog_changes = (dirty & /*modalDialog*/ 128)
				? get_spread_update(modaldialog_spread_levels, [get_spread_object(/*modalDialog*/ ctx[7])])
				: {};

				modaldialog.$set(modaldialog_changes);
				const modalform_changes = {};
				if (dirty & /*showFormModal*/ 256) modalform_changes.showModal = /*showFormModal*/ ctx[8];
				if (dirty & /*valueName*/ 512) modalform_changes.valueName = /*valueName*/ ctx[9];
				if (dirty & /*valueUrl*/ 1024) modalform_changes.valueUrl = /*valueUrl*/ ctx[10];
				modalform.$set(modalform_changes);
				const table_1_changes = {};
				if (dirty & /*selected*/ 2048) table_1_changes.selected = /*selected*/ ctx[11];
				if (dirty & /*table*/ 16) table_1_changes.data = /*table*/ ctx[4];
				table_1.$set(table_1_changes);
				const radioboxes_changes = {};
				if (dirty & /*selections*/ 64) radioboxes_changes.selections = /*selections*/ ctx[6];
				radioboxes.$set(radioboxes_changes);

				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block.d(1);
					if_block = current_block_type(ctx);

					if (if_block) {
						if_block.c();
						if_block.m(div4, null);
					}
				}

				const eventlog_changes = {};
				if (dirty & /*showLogs*/ 4096) eventlog_changes.showLogs = /*showLogs*/ ctx[12];
				if (dirty & /*logs*/ 8192) eventlog_changes.logs = /*logs*/ ctx[13];
				eventlog.$set(eventlog_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(headline.$$.fragment, local);
				transition_in(list_1.$$.fragment, local);
				transition_in(userinput.$$.fragment, local);
				transition_in(contenteditable.$$.fragment, local);
				transition_in(modaldialog.$$.fragment, local);
				transition_in(animation.$$.fragment, local);
				transition_in(modalform.$$.fragment, local);
				transition_in(table_1.$$.fragment, local);
				transition_in(radioboxes.$$.fragment, local);
				transition_in(profile.$$.fragment, local);
				transition_in(eventlog.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(headline.$$.fragment, local);
				transition_out(list_1.$$.fragment, local);
				transition_out(userinput.$$.fragment, local);
				transition_out(contenteditable.$$.fragment, local);
				transition_out(modaldialog.$$.fragment, local);
				transition_out(animation.$$.fragment, local);
				transition_out(modalform.$$.fragment, local);
				transition_out(table_1.$$.fragment, local);
				transition_out(radioboxes.$$.fragment, local);
				transition_out(profile.$$.fragment, local);
				transition_out(eventlog.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div6);
				}

				destroy_component(headline);
				destroy_component(list_1);
				destroy_component(userinput);
				destroy_component(contenteditable);
				destroy_component(modaldialog);
				destroy_component(animation);
				destroy_component(modalform);
				destroy_component(table_1);
				destroy_component(radioboxes);
				destroy_component(profile);
				if_block.d();
				destroy_component(eventlog);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance($$self, $$props, $$invalidate) {
		let $elapsed;
		validate_store(elapsed, 'elapsed');
		component_subscribe($$self, elapsed, $$value => $$invalidate(14, $elapsed = $$value));
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('App', slots, []);
		let { message, itemId } = $$props;
		let { list, currentItem } = $$props;
		let { table } = $$props;
		let { userInput } = $$props;
		let { selections } = $$props;
		let { modalDialog } = $$props;
		let { showFormModal, valueName = '', valueUrl = '' } = $$props;
		let { selected = '' } = $$props;
		let { showLogs = true, logs = '' } = $$props;

		// event handling
		const dispatch = createEventDispatcher();

		const listSelection = event => dispatch('listSelection', event.detail.item);
		const handleClickedRow = event => dispatch('handleClickedRow', event.detail);
		const sendForm = event => dispatch('sendForm', event.detail);
		const handleEvent = event => dispatch('handleEvent', event.detail);
		const handleUserEvent = event => dispatch('handleUserEvent', event.detail);

		$$self.$$.on_mount.push(function () {
			if (message === undefined && !('message' in $$props || $$self.$$.bound[$$self.$$.props['message']])) {
				console.warn("<App> was created without expected prop 'message'");
			}

			if (itemId === undefined && !('itemId' in $$props || $$self.$$.bound[$$self.$$.props['itemId']])) {
				console.warn("<App> was created without expected prop 'itemId'");
			}

			if (list === undefined && !('list' in $$props || $$self.$$.bound[$$self.$$.props['list']])) {
				console.warn("<App> was created without expected prop 'list'");
			}

			if (currentItem === undefined && !('currentItem' in $$props || $$self.$$.bound[$$self.$$.props['currentItem']])) {
				console.warn("<App> was created without expected prop 'currentItem'");
			}

			if (table === undefined && !('table' in $$props || $$self.$$.bound[$$self.$$.props['table']])) {
				console.warn("<App> was created without expected prop 'table'");
			}

			if (userInput === undefined && !('userInput' in $$props || $$self.$$.bound[$$self.$$.props['userInput']])) {
				console.warn("<App> was created without expected prop 'userInput'");
			}

			if (selections === undefined && !('selections' in $$props || $$self.$$.bound[$$self.$$.props['selections']])) {
				console.warn("<App> was created without expected prop 'selections'");
			}

			if (modalDialog === undefined && !('modalDialog' in $$props || $$self.$$.bound[$$self.$$.props['modalDialog']])) {
				console.warn("<App> was created without expected prop 'modalDialog'");
			}

			if (showFormModal === undefined && !('showFormModal' in $$props || $$self.$$.bound[$$self.$$.props['showFormModal']])) {
				console.warn("<App> was created without expected prop 'showFormModal'");
			}
		});

		const writable_props = [
			'message',
			'itemId',
			'list',
			'currentItem',
			'table',
			'userInput',
			'selections',
			'modalDialog',
			'showFormModal',
			'valueName',
			'valueUrl',
			'selected',
			'showLogs',
			'logs'
		];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
		});

		function edit_handler(event) {
			bubble.call(this, $$self, event);
		}

		function input_handler(event) {
			bubble.call(this, $$self, event);
		}

		function input_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		function close_handler(event) {
			bubble.call(this, $$self, event);
		}

		function close_handler_1(event) {
			bubble.call(this, $$self, event);
		}

		$$self.$$set = $$props => {
			if ('message' in $$props) $$invalidate(0, message = $$props.message);
			if ('itemId' in $$props) $$invalidate(1, itemId = $$props.itemId);
			if ('list' in $$props) $$invalidate(2, list = $$props.list);
			if ('currentItem' in $$props) $$invalidate(3, currentItem = $$props.currentItem);
			if ('table' in $$props) $$invalidate(4, table = $$props.table);
			if ('userInput' in $$props) $$invalidate(5, userInput = $$props.userInput);
			if ('selections' in $$props) $$invalidate(6, selections = $$props.selections);
			if ('modalDialog' in $$props) $$invalidate(7, modalDialog = $$props.modalDialog);
			if ('showFormModal' in $$props) $$invalidate(8, showFormModal = $$props.showFormModal);
			if ('valueName' in $$props) $$invalidate(9, valueName = $$props.valueName);
			if ('valueUrl' in $$props) $$invalidate(10, valueUrl = $$props.valueUrl);
			if ('selected' in $$props) $$invalidate(11, selected = $$props.selected);
			if ('showLogs' in $$props) $$invalidate(12, showLogs = $$props.showLogs);
			if ('logs' in $$props) $$invalidate(13, logs = $$props.logs);
		};

		$$self.$capture_state = () => ({
			elapsed,
			createEventDispatcher,
			Headline,
			List,
			Table,
			ModalDialog,
			ModalForm,
			UserInput,
			RadioBoxes,
			Contenteditable,
			Profile,
			EventLog,
			Animation,
			message,
			itemId,
			list,
			currentItem,
			table,
			userInput,
			selections,
			modalDialog,
			showFormModal,
			valueName,
			valueUrl,
			selected,
			showLogs,
			logs,
			dispatch,
			listSelection,
			handleClickedRow,
			sendForm,
			handleEvent,
			handleUserEvent,
			$elapsed
		});

		$$self.$inject_state = $$props => {
			if ('message' in $$props) $$invalidate(0, message = $$props.message);
			if ('itemId' in $$props) $$invalidate(1, itemId = $$props.itemId);
			if ('list' in $$props) $$invalidate(2, list = $$props.list);
			if ('currentItem' in $$props) $$invalidate(3, currentItem = $$props.currentItem);
			if ('table' in $$props) $$invalidate(4, table = $$props.table);
			if ('userInput' in $$props) $$invalidate(5, userInput = $$props.userInput);
			if ('selections' in $$props) $$invalidate(6, selections = $$props.selections);
			if ('modalDialog' in $$props) $$invalidate(7, modalDialog = $$props.modalDialog);
			if ('showFormModal' in $$props) $$invalidate(8, showFormModal = $$props.showFormModal);
			if ('valueName' in $$props) $$invalidate(9, valueName = $$props.valueName);
			if ('valueUrl' in $$props) $$invalidate(10, valueUrl = $$props.valueUrl);
			if ('selected' in $$props) $$invalidate(11, selected = $$props.selected);
			if ('showLogs' in $$props) $$invalidate(12, showLogs = $$props.showLogs);
			if ('logs' in $$props) $$invalidate(13, logs = $$props.logs);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			message,
			itemId,
			list,
			currentItem,
			table,
			userInput,
			selections,
			modalDialog,
			showFormModal,
			valueName,
			valueUrl,
			selected,
			showLogs,
			logs,
			$elapsed,
			listSelection,
			handleClickedRow,
			sendForm,
			handleEvent,
			handleUserEvent,
			edit_handler,
			input_handler,
			input_handler_1,
			close_handler,
			close_handler_1
		];
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(
				this,
				options,
				instance,
				create_fragment,
				safe_not_equal,
				{
					message: 0,
					itemId: 1,
					list: 2,
					currentItem: 3,
					table: 4,
					userInput: 5,
					selections: 6,
					modalDialog: 7,
					showFormModal: 8,
					valueName: 9,
					valueUrl: 10,
					selected: 11,
					showLogs: 12,
					logs: 13
				},
				add_css
			);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "App",
				options,
				id: create_fragment.name
			});
		}

		get message() {
			return this.$$.ctx[0];
		}

		set message(message) {
			this.$$set({ message });
			flush();
		}

		get itemId() {
			return this.$$.ctx[1];
		}

		set itemId(itemId) {
			this.$$set({ itemId });
			flush();
		}

		get list() {
			return this.$$.ctx[2];
		}

		set list(list) {
			this.$$set({ list });
			flush();
		}

		get currentItem() {
			return this.$$.ctx[3];
		}

		set currentItem(currentItem) {
			this.$$set({ currentItem });
			flush();
		}

		get table() {
			return this.$$.ctx[4];
		}

		set table(table) {
			this.$$set({ table });
			flush();
		}

		get userInput() {
			return this.$$.ctx[5];
		}

		set userInput(userInput) {
			this.$$set({ userInput });
			flush();
		}

		get selections() {
			return this.$$.ctx[6];
		}

		set selections(selections) {
			this.$$set({ selections });
			flush();
		}

		get modalDialog() {
			return this.$$.ctx[7];
		}

		set modalDialog(modalDialog) {
			this.$$set({ modalDialog });
			flush();
		}

		get showFormModal() {
			return this.$$.ctx[8];
		}

		set showFormModal(showFormModal) {
			this.$$set({ showFormModal });
			flush();
		}

		get valueName() {
			return this.$$.ctx[9];
		}

		set valueName(valueName) {
			this.$$set({ valueName });
			flush();
		}

		get valueUrl() {
			return this.$$.ctx[10];
		}

		set valueUrl(valueUrl) {
			this.$$set({ valueUrl });
			flush();
		}

		get selected() {
			return this.$$.ctx[11];
		}

		set selected(selected) {
			this.$$set({ selected });
			flush();
		}

		get showLogs() {
			return this.$$.ctx[12];
		}

		set showLogs(showLogs) {
			this.$$set({ showLogs });
			flush();
		}

		get logs() {
			return this.$$.ctx[13];
		}

		set logs(logs) {
			this.$$set({ logs });
			flush();
		}
	}

	const appProps = {
	  message: 'Svelte-Starter',
	  itemId: '',
	  currentItem: 0,
	  userInput: '',
	  list: [
	    { id: 1, name: 'Svelte', url: 'https://svelte.technology/' },
	    { id: 2, name: 'Rollup', url: 'https://rollupjs.org/' },
	    { id: 3, name: 'Cypress', url: 'https://cypress.io/' },
	    { id: 4, name: 'Prettier', url: 'https://prettier.io/' },
	    { id: 5, name: 'Vitest', url: 'https://vitest.dev/' },
	  ],
	  table: {
	    header: [
	      { value: 'ID', type: 'number' },
	      { value: 'Name', type: 'string' },
	      { value: 'URL', type: 'string' },
	    ],
	    entries: [
	      { id: 1, name: 'Svelte', url: 'https://svelte.technology/' },
	      { id: 2, name: 'Rollup', url: 'https://rollupjs.org/' },
	      { id: 3, name: 'Cypress', url: 'https://cypress.io/' },
	      { id: 4, name: 'Prettier', url: 'https://prettier.io/' },
	      { id: 5, name: 'Vitest', url: 'https://vitest.dev/' },
	    ],
	  },
	  showFormModal: false,
	  modalDialog: {
	    showModal: false,
	    headline: 'Modal',
	    body: 'Modal body text.<br>Plus this.',
	  },
	  selections: [
	    {
	      selector: 'A',
	      label: 'A',
	      text: '<p>This is the selection <strong>A</strong>.<br>It shows the information for A.</p>',
	    },
	    {
	      selector: 'B',
	      label: 'B',
	      text: '<p>This is the selection <strong>B</strong>.<br>It shows the information for B.</p>',
	    },
	    {
	      selector: 'C',
	      label: 'C',
	      text: '<p>This is the selection <strong>C</strong>.<br>It shows the information for C.</p>',
	    },
	  ],
	};

	const app = new App({
	  target: document.body,
	  props: appProps,
	});

	const logEvent = (event) => {
	  app.$set({
	    logs: app.logs
	      ? app.logs + '\n' + JSON.stringify(event)
	      : JSON.stringify(event),
	  });
	  document.querySelector('#eventLog').scrollTop =
	    document.querySelector('#eventLog').scrollHeight;
	};

	app.$on('listSelection', (event) => {
	  app.$set({
	    message: `Clicked item ${event.detail.name}`,
	    itemId: `Id: ${event.detail.id}`,
	    selected: event.detail.name,
	  });
	  logEvent(event.detail);
	});

	app.$on('handleClickedRow', (event) => {
	  app.$set({
	    message: `Clicked item ${event.detail.name}`,
	    itemId: `Id: ${event.detail.id}`,
	    selected: event.detail.name,
	    currentItem: event.detail.id,
	  });
	  logEvent(event.detail);
	});

	app.$on('edit', (event) => {
	  app.$set({
	    valueName: event.detail.item.name,
	    valueUrl: event.detail.item.url,
	    showFormModal: true,
	  });
	  logEvent(event.detail);
	});

	app.$on('close', (event) => {
	  app.$set({ showFormModal: false });
	  logEvent(event.detail);
	});

	app.$on('handleEvent', (event) => {
	  logEvent(event.detail);
	});

	app.$on('input', (event) => {
	  logEvent(event.detail);
	});

	app.$on('handleUserEvent', (event) => {
	  userActivity();
	});

	app.$on('sendForm', (event) => {
	  app.$set({ showFormModal: false });
	  logEvent(event.detail);
	});

	return app;

})();
//# sourceMappingURL=bundle.js.map
