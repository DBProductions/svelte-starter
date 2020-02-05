
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
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
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
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

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(html, anchor = null) {
            this.e = element('div');
            this.a = anchor;
            this.u(html);
        }
        m(target, anchor = null) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(target, this.n[i], anchor);
            }
            this.t = target;
        }
        u(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        p(html) {
            this.d();
            this.u(html);
            this.m(this.t, this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    const seen_callbacks = new Set();
    function flush() {
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
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
    }
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
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
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
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
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined' ? window : global);

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
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
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
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
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
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const time = readable(new Date(), function start(set) {
      const interval = setInterval(() => {
        set(new Date());
      }, 1000);

      return function stop() {
        clearInterval(interval);
      }
    });

    let start = new Date();

    const userActivity = () => {
      start = new Date();
    };

    const elapsed = derived(time, $time =>
      Math.round(($time - start) / 1000)
    );

    /* src/components/Headline.svelte generated by Svelte v3.18.1 */

    const file = "src/components/Headline.svelte";

    function create_fragment(ctx) {
    	let h1;
    	let t0;
    	let t1;
    	let small;
    	let t2;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(/*message*/ ctx[0]);
    			t1 = space();
    			small = element("small");
    			t2 = text(/*itemId*/ ctx[1]);
    			attr_dev(small, "class", "svelte-1pe6e7k");
    			add_location(small, file, 17, 2, 197);
    			attr_dev(h1, "class", "svelte-1pe6e7k");
    			add_location(h1, file, 15, 0, 178);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, small);
    			append_dev(small, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*message*/ 1) set_data_dev(t0, /*message*/ ctx[0]);
    			if (dirty & /*itemId*/ 2) set_data_dev(t2, /*itemId*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
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
    	let { message = "" } = $$props;
    	let { itemId = "" } = $$props;
    	const writable_props = ["message", "itemId"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Headline> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("message" in $$props) $$invalidate(0, message = $$props.message);
    		if ("itemId" in $$props) $$invalidate(1, itemId = $$props.itemId);
    	};

    	$$self.$capture_state = () => {
    		return { message, itemId };
    	};

    	$$self.$inject_state = $$props => {
    		if ("message" in $$props) $$invalidate(0, message = $$props.message);
    		if ("itemId" in $$props) $$invalidate(1, itemId = $$props.itemId);
    	};

    	return [message, itemId];
    }

    class Headline extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { message: 0, itemId: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Headline",
    			options,
    			id: create_fragment.name
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

    /* src/components/ListItem.svelte generated by Svelte v3.18.1 */
    const file$1 = "src/components/ListItem.svelte";

    function create_fragment$1(ctx) {
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
    			add_location(buttton, file$1, 36, 4, 715);
    			set_style(div0, "float", "right");
    			add_location(div0, file$1, 35, 2, 684);
    			add_location(small, file$1, 40, 4, 824);
    			add_location(div1, file$1, 38, 2, 772);
    			attr_dev(li, "class", "svelte-1hjebxh");
    			toggle_class(li, "active", /*currentItem*/ ctx[1] === /*item*/ ctx[0].id);
    			add_location(li, file$1, 34, 0, 638);
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

    			dispose = [
    				listen_dev(
    					buttton,
    					"click",
    					function () {
    						if (is_function(/*edit*/ ctx[3](/*item*/ ctx[0]))) /*edit*/ ctx[3](/*item*/ ctx[0]).apply(this, arguments);
    					},
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
    					false
    				)
    			];
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
    			if (detaching) detach_dev(li);
    			run_all(dispose);
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
    	let { item = { id: 0, name: "" } } = $$props;
    	let { currentItem = 0 } = $$props;
    	const dispatch = createEventDispatcher();
    	const select = () => dispatch("select", { item });
    	const edit = () => dispatch("edit", { item });
    	const writable_props = ["item", "currentItem"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ListItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("currentItem" in $$props) $$invalidate(1, currentItem = $$props.currentItem);
    	};

    	$$self.$capture_state = () => {
    		return { item, currentItem };
    	};

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("currentItem" in $$props) $$invalidate(1, currentItem = $$props.currentItem);
    	};

    	return [item, currentItem, select, edit];
    }

    class ListItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { item: 0, currentItem: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ListItem",
    			options,
    			id: create_fragment$1.name
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

    /* src/components/List.svelte generated by Svelte v3.18.1 */
    const file$2 = "src/components/List.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (27:4) {#each list as item}
    function create_each_block(ctx) {
    	let current;

    	const listitem = new ListItem({
    			props: {
    				currentItem: /*currentItem*/ ctx[0],
    				item: /*item*/ ctx[5]
    			},
    			$$inline: true
    		});

    	listitem.$on("select", /*select*/ ctx[2]);
    	listitem.$on("edit", /*edit*/ ctx[3]);

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
    		id: create_each_block.name,
    		type: "each",
    		source: "(27:4) {#each list as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let ul;
    	let current;
    	let each_value = /*list*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
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
    			add_location(ul, file$2, 25, 2, 467);
    			add_location(div, file$2, 24, 0, 459);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*currentItem, list, select, edit*/ 15) {
    				each_value = /*list*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
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
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
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
    	let { list = [] } = $$props;
    	let { currentItem = 0 } = $$props;
    	const dispatch = createEventDispatcher();

    	const select = event => {
    		$$invalidate(0, currentItem = event.detail.item.id);
    		dispatch("select", event.detail);
    	};

    	const edit = event => dispatch("edit", event.detail);
    	const writable_props = ["list", "currentItem"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("list" in $$props) $$invalidate(1, list = $$props.list);
    		if ("currentItem" in $$props) $$invalidate(0, currentItem = $$props.currentItem);
    	};

    	$$self.$capture_state = () => {
    		return { list, currentItem };
    	};

    	$$self.$inject_state = $$props => {
    		if ("list" in $$props) $$invalidate(1, list = $$props.list);
    		if ("currentItem" in $$props) $$invalidate(0, currentItem = $$props.currentItem);
    	};

    	return [currentItem, list, select, edit];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { list: 1, currentItem: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$2.name
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

    /* src/components/Table.svelte generated by Svelte v3.18.1 */
    const file$3 = "src/components/Table.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (67:6) {#each data.header as header}
    function create_each_block_1(ctx) {
    	let th;
    	let t_value = /*header*/ ctx[7] + "";
    	let t;

    	const block = {
    		c: function create() {
    			th = element("th");
    			t = text(t_value);
    			attr_dev(th, "class", "svelte-1b28e7m");
    			add_location(th, file$3, 67, 8, 981);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*header*/ ctx[7] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(67:6) {#each data.header as header}",
    		ctx
    	});

    	return block;
    }

    // (73:4) {#each data.entries as entry}
    function create_each_block$1(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*entry*/ ctx[4].name + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*entry*/ ctx[4].url + "";
    	let t2;
    	let t3;
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
    			attr_dev(td0, "class", "svelte-1b28e7m");
    			add_location(td0, file$3, 74, 8, 1166);
    			attr_dev(td1, "class", "svelte-1b28e7m");
    			add_location(td1, file$3, 75, 8, 1196);
    			attr_dev(tr, "class", "svelte-1b28e7m");
    			toggle_class(tr, "active", /*selected*/ ctx[1] === /*entry*/ ctx[4].name);
    			add_location(tr, file$3, 73, 6, 1084);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);

    			dispose = listen_dev(
    				tr,
    				"click",
    				function () {
    					if (is_function(/*handleClick*/ ctx[2](/*entry*/ ctx[4]))) /*handleClick*/ ctx[2](/*entry*/ ctx[4]).apply(this, arguments);
    				},
    				false,
    				false,
    				false
    			);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*entry*/ ctx[4].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*data*/ 1 && t2_value !== (t2_value = /*entry*/ ctx[4].url + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*selected, data*/ 3) {
    				toggle_class(tr, "active", /*selected*/ ctx[1] === /*entry*/ ctx[4].name);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(73:4) {#each data.entries as entry}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let table;
    	let thead;
    	let tr;
    	let t;
    	let tbody;
    	let each_value_1 = /*data*/ ctx[0].header;
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*data*/ ctx[0].entries;
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

    			attr_dev(tr, "class", "svelte-1b28e7m");
    			add_location(tr, file$3, 65, 4, 932);
    			add_location(thead, file$3, 64, 2, 920);
    			attr_dev(tbody, "class", "svelte-1b28e7m");
    			add_location(tbody, file$3, 71, 2, 1036);
    			attr_dev(table, "class", "svelte-1b28e7m");
    			add_location(table, file$3, 63, 0, 910);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tr, null);
    			}

    			append_dev(table, t);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data*/ 1) {
    				each_value_1 = /*data*/ ctx[0].header;
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
    				each_value = /*data*/ ctx[0].entries;
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
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { data = "" } = $$props;
    	let { selected = "" } = $$props;
    	const dispatch = createEventDispatcher();
    	const handleClick = entry => dispatch("clickedRow", entry);
    	const writable_props = ["data", "selected"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Table> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("selected" in $$props) $$invalidate(1, selected = $$props.selected);
    	};

    	$$self.$capture_state = () => {
    		return { data, selected };
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("selected" in $$props) $$invalidate(1, selected = $$props.selected);
    	};

    	return [data, selected, handleClick];
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { data: 0, selected: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$3.name
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

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function quintOut(t) {
        return --t * t * t * t * t + 1;
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/components/Modal.svelte generated by Svelte v3.18.1 */
    const file$4 = "src/components/Modal.svelte";
    const get_header_slot_changes = dirty => ({});
    const get_header_slot_context = ctx => ({});

    // (88:2) {#if modalForm}
    function create_if_block(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Send";
    			attr_dev(button, "class", "sendBtn svelte-ew3v5m");
    			add_location(button, file$4, 88, 4, 1970);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			dispose = listen_dev(button, "click", /*send*/ ctx[2], false, false, false);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(88:2) {#if modalForm}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let t2;
    	let t3;
    	let button;
    	let div1_transition;
    	let current;
    	let dispose;
    	const header_slot_template = /*$$slots*/ ctx[8].header;
    	const header_slot = create_slot(header_slot_template, ctx, /*$$scope*/ ctx[7], get_header_slot_context);
    	const default_slot_template = /*$$slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);
    	let if_block = /*modalForm*/ ctx[0] && create_if_block(ctx);

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
    			button = element("button");
    			button.textContent = "Close";
    			attr_dev(div0, "class", "modal-background svelte-ew3v5m");
    			add_location(div0, file$4, 76, 0, 1654);
    			attr_dev(button, "class", "svelte-ew3v5m");
    			add_location(button, file$4, 90, 2, 2034);
    			attr_dev(div1, "class", "modal svelte-ew3v5m");
    			attr_dev(div1, "role", "dialog");
    			attr_dev(div1, "aria-modal", "true");
    			add_location(div1, file$4, 78, 0, 1705);
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
    			append_dev(div1, button);
    			/*div1_binding*/ ctx[9](div1);
    			current = true;

    			dispose = [
    				listen_dev(window, "keydown", /*handleKeydown*/ ctx[4], false, false, false),
    				listen_dev(div0, "click", /*close*/ ctx[3], false, false, false),
    				listen_dev(button, "click", /*close*/ ctx[3], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (header_slot && header_slot.p && dirty & /*$$scope*/ 128) {
    				header_slot.p(get_slot_context(header_slot_template, ctx, /*$$scope*/ ctx[7], get_header_slot_context), get_slot_changes(header_slot_template, /*$$scope*/ ctx[7], dirty, get_header_slot_changes));
    			}

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 128) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[7], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[7], dirty, null));
    			}

    			if (/*modalForm*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div1, t3);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header_slot, local);
    			transition_in(default_slot, local);

    			add_render_callback(() => {
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

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header_slot, local);
    			transition_out(default_slot, local);

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
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (header_slot) header_slot.d(detaching);
    			if (default_slot) default_slot.d(detaching);
    			if (if_block) if_block.d();
    			/*div1_binding*/ ctx[9](null);
    			if (detaching && div1_transition) div1_transition.end();
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
    	let { modalForm = false } = $$props;
    	const dispatch = createEventDispatcher();
    	const send = () => dispatch("sendForm");
    	const close = () => dispatch("close");
    	let modal;

    	const handleKeydown = e => {
    		if (e.key === "Escape") {
    			close();
    			return;
    		}

    		if (e.key === "Tab") {
    			const nodes = modal.querySelectorAll("*");
    			const tabbable = Array.from(nodes).filter(n => n.tabIndex >= 0);
    			let index = tabbable.indexOf(document.activeElement);
    			if (index === -1 && e.shiftKey) index = 0;
    			index += tabbable.length + (e.shiftKey ? -1 : 1);
    			index %= tabbable.length;
    			tabbable[index].focus();
    			e.preventDefault();
    		}
    	};

    	const previously_focused = typeof document !== "undefined" && document.activeElement;

    	if (previously_focused) {
    		onDestroy(() => {
    			previously_focused.focus();
    		});
    	}

    	const writable_props = ["modalForm"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, modal = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("modalForm" in $$props) $$invalidate(0, modalForm = $$props.modalForm);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { modalForm, modal };
    	};

    	$$self.$inject_state = $$props => {
    		if ("modalForm" in $$props) $$invalidate(0, modalForm = $$props.modalForm);
    		if ("modal" in $$props) $$invalidate(1, modal = $$props.modal);
    	};

    	return [
    		modalForm,
    		modal,
    		send,
    		close,
    		handleKeydown,
    		dispatch,
    		previously_focused,
    		$$scope,
    		$$slots,
    		div1_binding
    	];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { modalForm: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get modalForm() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set modalForm(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/ModalDialog.svelte generated by Svelte v3.18.1 */
    const file$5 = "src/components/ModalDialog.svelte";

    // (19:0) {#if showModal}
    function create_if_block$1(ctx) {
    	let current;

    	const modal = new Modal({
    			props: {
    				$$slots: {
    					default: [create_default_slot],
    					header: [create_header_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	modal.$on("close", /*close*/ ctx[3]);

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

    			if (dirty & /*$$scope, body, headline*/ 70) {
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(19:0) {#if showModal}",
    		ctx
    	});

    	return block;
    }

    // (21:4) <h2 slot="header">
    function create_header_slot(ctx) {
    	let h2;
    	let t;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t = text(/*headline*/ ctx[1]);
    			attr_dev(h2, "slot", "header");
    			add_location(h2, file$5, 20, 4, 421);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*headline*/ 2) set_data_dev(t, /*headline*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_header_slot.name,
    		type: "slot",
    		source: "(21:4) <h2 slot=\\\"header\\\">",
    		ctx
    	});

    	return block;
    }

    // (20:2) <Modal on:close={close}>
    function create_default_slot(ctx) {
    	let t;
    	let p;

    	const block = {
    		c: function create() {
    			t = space();
    			p = element("p");
    			add_location(p, file$5, 21, 4, 459);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			insert_dev(target, p, anchor);
    			p.innerHTML = /*body*/ ctx[2];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*body*/ 4) p.innerHTML = /*body*/ ctx[2];		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(20:2) <Modal on:close={close}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let button;
    	let t1;
    	let if_block_anchor;
    	let current;
    	let dispose;
    	let if_block = /*showModal*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Modal";
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(button, file$5, 16, 0, 314);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showModal*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
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
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			dispose();
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
    	let { showModal = false } = $$props;
    	let { headline = "Modal" } = $$props;
    	let { body = "" } = $$props;
    	const dispatch = createEventDispatcher();

    	const close = () => {
    		$$invalidate(0, showModal = false);
    		dispatch("close", {});
    	};

    	const writable_props = ["showModal", "headline", "body"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ModalDialog> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, showModal = true);

    	$$self.$set = $$props => {
    		if ("showModal" in $$props) $$invalidate(0, showModal = $$props.showModal);
    		if ("headline" in $$props) $$invalidate(1, headline = $$props.headline);
    		if ("body" in $$props) $$invalidate(2, body = $$props.body);
    	};

    	$$self.$capture_state = () => {
    		return { showModal, headline, body };
    	};

    	$$self.$inject_state = $$props => {
    		if ("showModal" in $$props) $$invalidate(0, showModal = $$props.showModal);
    		if ("headline" in $$props) $$invalidate(1, headline = $$props.headline);
    		if ("body" in $$props) $$invalidate(2, body = $$props.body);
    	};

    	return [showModal, headline, body, close, dispatch, click_handler];
    }

    class ModalDialog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { showModal: 0, headline: 1, body: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalDialog",
    			options,
    			id: create_fragment$5.name
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
    }

    /* src/components/ModalForm.svelte generated by Svelte v3.18.1 */
    const file$6 = "src/components/ModalForm.svelte";

    // (36:0) {#if showModal}
    function create_if_block$2(ctx) {
    	let current;

    	const modal = new Modal({
    			props: {
    				modalForm: /*modalForm*/ ctx[3],
    				$$slots: {
    					default: [create_default_slot$1],
    					header: [create_header_slot$1]
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

    			if (dirty & /*$$scope, valueUrl, placeholderUrl, valueName, placeholderName, headline*/ 4214) {
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(36:0) {#if showModal}",
    		ctx
    	});

    	return block;
    }

    // (38:4) <h2 slot="header">
    function create_header_slot$1(ctx) {
    	let h2;
    	let t;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t = text(/*headline*/ ctx[4]);
    			attr_dev(h2, "slot", "header");
    			add_location(h2, file$6, 37, 4, 793);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*headline*/ 16) set_data_dev(t, /*headline*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_header_slot$1.name,
    		type: "slot",
    		source: "(38:4) <h2 slot=\\\"header\\\">",
    		ctx
    	});

    	return block;
    }

    // (37:2) <Modal {modalForm} on:close={close} on:sendForm={sendForm}>
    function create_default_slot$1(ctx) {
    	let t0;
    	let div0;
    	let input0;
    	let t1;
    	let div1;
    	let input1;
    	let dispose;

    	const block = {
    		c: function create() {
    			t0 = space();
    			div0 = element("div");
    			input0 = element("input");
    			t1 = space();
    			div1 = element("div");
    			input1 = element("input");
    			attr_dev(input0, "type", "text");
    			input0.value = /*valueName*/ ctx[1];
    			attr_dev(input0, "placeholder", /*placeholderName*/ ctx[5]);
    			attr_dev(input0, "class", "svelte-13cwivs");
    			add_location(input0, file$6, 39, 6, 843);
    			add_location(div0, file$6, 38, 4, 831);
    			attr_dev(input1, "type", "text");
    			input1.value = /*valueUrl*/ ctx[2];
    			attr_dev(input1, "placeholder", /*placeholderUrl*/ ctx[6]);
    			attr_dev(input1, "class", "svelte-13cwivs");
    			add_location(input1, file$6, 46, 6, 995);
    			add_location(div1, file$6, 45, 4, 983);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, input0);
    			set_input_value(input0, /*valueName*/ ctx[1]);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input1);
    			set_input_value(input1, /*valueUrl*/ ctx[2]);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[10]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[11])
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*valueName*/ 2 && input0.value !== /*valueName*/ ctx[1]) {
    				prop_dev(input0, "value", /*valueName*/ ctx[1]);
    			}

    			if (dirty & /*placeholderName*/ 32) {
    				attr_dev(input0, "placeholder", /*placeholderName*/ ctx[5]);
    			}

    			if (dirty & /*valueName*/ 2 && input0.value !== /*valueName*/ ctx[1]) {
    				set_input_value(input0, /*valueName*/ ctx[1]);
    			}

    			if (dirty & /*valueUrl*/ 4 && input1.value !== /*valueUrl*/ ctx[2]) {
    				prop_dev(input1, "value", /*valueUrl*/ ctx[2]);
    			}

    			if (dirty & /*placeholderUrl*/ 64) {
    				attr_dev(input1, "placeholder", /*placeholderUrl*/ ctx[6]);
    			}

    			if (dirty & /*valueUrl*/ 4 && input1.value !== /*valueUrl*/ ctx[2]) {
    				set_input_value(input1, /*valueUrl*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(37:2) <Modal {modalForm} on:close={close} on:sendForm={sendForm}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*showModal*/ ctx[0] && create_if_block$2(ctx);

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
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$2(ctx);
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let { showModal = false } = $$props;
    	let { modalForm = true } = $$props;
    	let { headline = "Modal" } = $$props;
    	let { valueName = "" } = $$props;
    	let { valueUrl = "" } = $$props;
    	let { placeholderName = "Name" } = $$props;
    	let { placeholderUrl = "URL" } = $$props;
    	const dispatch = createEventDispatcher();

    	const sendForm = () => {
    		dispatch("sendForm", { name: valueName, url: valueUrl });
    		$$invalidate(0, showModal = false);
    	};

    	const close = () => {
    		$$invalidate(0, showModal = false);
    		dispatch("close", {});
    	};

    	const writable_props = [
    		"showModal",
    		"modalForm",
    		"headline",
    		"valueName",
    		"valueUrl",
    		"placeholderName",
    		"placeholderUrl"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ModalForm> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		valueName = this.value;
    		$$invalidate(1, valueName);
    	}

    	function input1_input_handler() {
    		valueUrl = this.value;
    		$$invalidate(2, valueUrl);
    	}

    	$$self.$set = $$props => {
    		if ("showModal" in $$props) $$invalidate(0, showModal = $$props.showModal);
    		if ("modalForm" in $$props) $$invalidate(3, modalForm = $$props.modalForm);
    		if ("headline" in $$props) $$invalidate(4, headline = $$props.headline);
    		if ("valueName" in $$props) $$invalidate(1, valueName = $$props.valueName);
    		if ("valueUrl" in $$props) $$invalidate(2, valueUrl = $$props.valueUrl);
    		if ("placeholderName" in $$props) $$invalidate(5, placeholderName = $$props.placeholderName);
    		if ("placeholderUrl" in $$props) $$invalidate(6, placeholderUrl = $$props.placeholderUrl);
    	};

    	$$self.$capture_state = () => {
    		return {
    			showModal,
    			modalForm,
    			headline,
    			valueName,
    			valueUrl,
    			placeholderName,
    			placeholderUrl
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("showModal" in $$props) $$invalidate(0, showModal = $$props.showModal);
    		if ("modalForm" in $$props) $$invalidate(3, modalForm = $$props.modalForm);
    		if ("headline" in $$props) $$invalidate(4, headline = $$props.headline);
    		if ("valueName" in $$props) $$invalidate(1, valueName = $$props.valueName);
    		if ("valueUrl" in $$props) $$invalidate(2, valueUrl = $$props.valueUrl);
    		if ("placeholderName" in $$props) $$invalidate(5, placeholderName = $$props.placeholderName);
    		if ("placeholderUrl" in $$props) $$invalidate(6, placeholderUrl = $$props.placeholderUrl);
    	};

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
    		dispatch,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class ModalForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			showModal: 0,
    			modalForm: 3,
    			headline: 4,
    			valueName: 1,
    			valueUrl: 2,
    			placeholderName: 5,
    			placeholderUrl: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ModalForm",
    			options,
    			id: create_fragment$6.name
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

    /* src/components/UserInput.svelte generated by Svelte v3.18.1 */
    const file$7 = "src/components/UserInput.svelte";

    // (31:2) {#if result}
    function create_if_block$3(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*result*/ ctx[1]);
    			attr_dev(div, "class", "svelte-1v2du3o");
    			add_location(div, file$7, 31, 4, 570);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*result*/ 2) set_data_dev(t, /*result*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(31:2) {#if result}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let t0;
    	let input;
    	let t1;
    	let t2;
    	let t3;
    	let dispose;
    	let if_block = /*result*/ ctx[1] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Two-way binding\n  ");
    			input = element("input");
    			t1 = space();
    			t2 = text(/*userInput*/ ctx[0]);
    			t3 = space();
    			if (if_block) if_block.c();
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-1v2du3o");
    			add_location(input, file$7, 28, 2, 472);
    			attr_dev(div, "class", "svelte-1v2du3o");
    			add_location(div, file$7, 26, 0, 446);
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
    			append_dev(div, t2);
    			append_dev(div, t3);
    			if (if_block) if_block.m(div, null);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    				listen_dev(input, "keyup", /*keypress*/ ctx[2], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*userInput*/ 1 && input.value !== /*userInput*/ ctx[0]) {
    				set_input_value(input, /*userInput*/ ctx[0]);
    			}

    			if (dirty & /*userInput*/ 1) set_data_dev(t2, /*userInput*/ ctx[0]);

    			if (/*result*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			run_all(dispose);
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
    	let { userInput = "" } = $$props;
    	let { result = "" } = $$props;
    	const dispatch = createEventDispatcher();

    	const keypress = () => {
    		dispatch("input", { input: userInput });
    	};

    	const writable_props = ["userInput", "result"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<UserInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		userInput = this.value;
    		$$invalidate(0, userInput);
    	}

    	$$self.$set = $$props => {
    		if ("userInput" in $$props) $$invalidate(0, userInput = $$props.userInput);
    		if ("result" in $$props) $$invalidate(1, result = $$props.result);
    	};

    	$$self.$capture_state = () => {
    		return { userInput, result };
    	};

    	$$self.$inject_state = $$props => {
    		if ("userInput" in $$props) $$invalidate(0, userInput = $$props.userInput);
    		if ("result" in $$props) $$invalidate(1, result = $$props.result);
    	};

    	return [userInput, result, keypress, dispatch, input_input_handler];
    }

    class UserInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { userInput: 0, result: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UserInput",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get userInput() {
    		throw new Error("<UserInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userInput(value) {
    		throw new Error("<UserInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get result() {
    		throw new Error("<UserInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set result(value) {
    		throw new Error("<UserInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/RadioBoxes.svelte generated by Svelte v3.18.1 */
    const file$8 = "src/components/RadioBoxes.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i].selector;
    	child_ctx[6] = list[i].label;
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (44:6) {#each selections as { selector, label }
    function create_each_block$2(ctx) {
    	let label;
    	let input;
    	let input_value_value;
    	let t0;
    	let t1_value = /*label*/ ctx[6] + "";
    	let t1;
    	let t2;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "radio");
    			attr_dev(input, "name", "selection");
    			input.value = input_value_value = /*selector*/ ctx[5];
    			add_location(input, file$8, 47, 10, 1060);
    			attr_dev(label, "class", "svelte-krl4w6");
    			toggle_class(label, "active", /*current*/ ctx[1] === /*selector*/ ctx[5]);
    			add_location(label, file$8, 44, 8, 952);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(label, t2);

    			dispose = listen_dev(
    				label,
    				"click",
    				function () {
    					if (is_function(/*setSelection*/ ctx[3](/*selector*/ ctx[5]))) /*setSelection*/ ctx[3](/*selector*/ ctx[5]).apply(this, arguments);
    				},
    				false,
    				false,
    				false
    			);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*selections*/ 1 && input_value_value !== (input_value_value = /*selector*/ ctx[5])) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty & /*selections*/ 1 && t1_value !== (t1_value = /*label*/ ctx[6] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*current, selections*/ 3) {
    				toggle_class(label, "active", /*current*/ ctx[1] === /*selector*/ ctx[5]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(44:6) {#each selections as { selector, label }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div2;
    	let div0;
    	let fieldset;
    	let t0;
    	let div1;
    	let t1;
    	let t2_value = (/*current*/ ctx[1] ? /*current*/ ctx[1] : "nothing") + "";
    	let t2;
    	let t3;
    	let html_tag;
    	let each_value = /*selections*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
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
    			attr_dev(fieldset, "id", "group1");
    			attr_dev(fieldset, "class", "svelte-krl4w6");
    			add_location(fieldset, file$8, 42, 4, 870);
    			attr_dev(div0, "class", "svelte-krl4w6");
    			add_location(div0, file$8, 41, 2, 860);
    			html_tag = new HtmlTag(/*information*/ ctx[2], null);
    			attr_dev(div1, "class", "svelte-krl4w6");
    			add_location(div1, file$8, 53, 2, 1193);
    			attr_dev(div2, "class", "selection-container svelte-krl4w6");
    			add_location(div2, file$8, 40, 0, 824);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, fieldset);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(fieldset, null);
    			}

    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, t1);
    			append_dev(div1, t2);
    			append_dev(div1, t3);
    			html_tag.m(div1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*current, selections, setSelection*/ 11) {
    				each_value = /*selections*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(fieldset, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*current*/ 2 && t2_value !== (t2_value = (/*current*/ ctx[1] ? /*current*/ ctx[1] : "nothing") + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*information*/ 4) html_tag.p(/*information*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
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
    	let { selections = {} } = $$props;
    	const dispatch = createEventDispatcher();
    	let current = "";
    	let information = "<p>Nothing to display.</p>";

    	const setSelection = selector => {
    		$$invalidate(1, current = selector);
    		const item = selections.find(o => o.selector === selector);
    		$$invalidate(2, information = item.text);
    		dispatch("select", { current });
    	};

    	const writable_props = ["selections"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RadioBoxes> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("selections" in $$props) $$invalidate(0, selections = $$props.selections);
    	};

    	$$self.$capture_state = () => {
    		return { selections, current, information };
    	};

    	$$self.$inject_state = $$props => {
    		if ("selections" in $$props) $$invalidate(0, selections = $$props.selections);
    		if ("current" in $$props) $$invalidate(1, current = $$props.current);
    		if ("information" in $$props) $$invalidate(2, information = $$props.information);
    	};

    	return [selections, current, information, setSelection];
    }

    class RadioBoxes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { selections: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RadioBoxes",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get selections() {
    		throw new Error("<RadioBoxes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selections(value) {
    		throw new Error("<RadioBoxes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Contenteditable.svelte generated by Svelte v3.18.1 */
    const file$9 = "src/components/Contenteditable.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "contenteditable", "true");
    			if (/*content*/ ctx[0] === void 0) add_render_callback(() => /*div_input_handler*/ ctx[3].call(div));
    			add_location(div, file$9, 12, 0, 233);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (/*content*/ ctx[0] !== void 0) {
    				div.textContent = /*content*/ ctx[0];
    			}

    			dispose = [
    				listen_dev(div, "input", /*div_input_handler*/ ctx[3]),
    				listen_dev(div, "keyup", /*keypress*/ ctx[1], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*content*/ 1 && /*content*/ ctx[0] !== div.textContent) {
    				div.textContent = /*content*/ ctx[0];
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	let content = "This content is editable.";
    	const dispatch = createEventDispatcher();

    	const keypress = () => {
    		dispatch("edited", { input: content });
    	};

    	function div_input_handler() {
    		content = this.textContent;
    		$$invalidate(0, content);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("content" in $$props) $$invalidate(0, content = $$props.content);
    	};

    	return [content, keypress, dispatch, div_input_handler];
    }

    class Contenteditable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contenteditable",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.18.1 */

    const { console: console_1 } = globals;
    const file$a = "src/App.svelte";

    function create_fragment$a(ctx) {
    	let div6;
    	let div0;
    	let t0;
    	let div3;
    	let div1;
    	let t1;
    	let t2;
    	let t3;
    	let div2;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let div5;
    	let div4;
    	let t8;
    	let t9;
    	let t10;
    	let t11_value = (/*$elapsed*/ ctx[13] === 1 ? "second" : "seconds") + "";
    	let t11;
    	let current;
    	let dispose;

    	const headline = new Headline({
    			props: {
    				message: /*message*/ ctx[0],
    				itemId: /*itemId*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const list_1 = new List({
    			props: {
    				list: /*list*/ ctx[3],
    				currentItem: /*currentItem*/ ctx[2]
    			},
    			$$inline: true
    		});

    	list_1.$on("select", /*listSelection*/ ctx[14]);
    	list_1.$on("edit", /*edit*/ ctx[16]);

    	const userinput = new UserInput({
    			props: {
    				userInput: /*userInput*/ ctx[5],
    				result: /*result*/ ctx[6]
    			},
    			$$inline: true
    		});

    	userinput.$on("input", /*handleInput*/ ctx[18]);
    	const contenteditable = new Contenteditable({ $$inline: true });
    	contenteditable.$on("edited", /*handleInput*/ ctx[18]);

    	const table_1 = new Table({
    			props: {
    				selected: /*selected*/ ctx[9],
    				data: /*table*/ ctx[4]
    			},
    			$$inline: true
    		});

    	table_1.$on("clickedRow", /*handleClickedRow*/ ctx[15]);

    	const radioboxes = new RadioBoxes({
    			props: { selections: /*selections*/ ctx[8] },
    			$$inline: true
    		});

    	radioboxes.$on("select", /*handleEvent*/ ctx[20]);
    	const modaldialog_spread_levels = [/*modalDialog*/ ctx[7]];
    	let modaldialog_props = {};

    	for (let i = 0; i < modaldialog_spread_levels.length; i += 1) {
    		modaldialog_props = assign(modaldialog_props, modaldialog_spread_levels[i]);
    	}

    	const modaldialog = new ModalDialog({ props: modaldialog_props, $$inline: true });
    	modaldialog.$on("close", /*closeModal*/ ctx[17]);

    	const modalform = new ModalForm({
    			props: {
    				showModal: /*showFormModal*/ ctx[10],
    				valueName: /*valueName*/ ctx[11],
    				valueUrl: /*valueUrl*/ ctx[12]
    			},
    			$$inline: true
    		});

    	modalform.$on("sendForm", /*sendForm*/ ctx[19]);
    	modalform.$on("close", /*closeModal*/ ctx[17]);

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
    			div2 = element("div");
    			create_component(table_1.$$.fragment);
    			t4 = space();
    			create_component(radioboxes.$$.fragment);
    			t5 = space();
    			create_component(modaldialog.$$.fragment);
    			t6 = space();
    			create_component(modalform.$$.fragment);
    			t7 = space();
    			div5 = element("div");
    			div4 = element("div");
    			t8 = text("The user is inactive for ");
    			t9 = text(/*$elapsed*/ ctx[13]);
    			t10 = space();
    			t11 = text(t11_value);
    			add_location(div0, file$a, 102, 2, 2234);
    			attr_dev(div1, "class", "left-column svelte-15uvdht");
    			add_location(div1, file$a, 106, 4, 2313);
    			attr_dev(div2, "class", "right-column svelte-15uvdht");
    			add_location(div2, file$a, 113, 4, 2547);
    			attr_dev(div3, "class", "columns svelte-15uvdht");
    			add_location(div3, file$a, 105, 2, 2287);
    			add_location(div4, file$a, 131, 4, 3055);
    			attr_dev(div5, "class", "footer svelte-15uvdht");
    			add_location(div5, file$a, 130, 2, 3030);
    			attr_dev(div6, "id", "container");
    			attr_dev(div6, "class", "svelte-15uvdht");
    			add_location(div6, file$a, 101, 0, 2211);
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
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			mount_component(table_1, div2, null);
    			append_dev(div2, t4);
    			mount_component(radioboxes, div2, null);
    			append_dev(div2, t5);
    			mount_component(modaldialog, div2, null);
    			append_dev(div2, t6);
    			mount_component(modalform, div2, null);
    			append_dev(div6, t7);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, t8);
    			append_dev(div4, t9);
    			append_dev(div4, t10);
    			append_dev(div4, t11);
    			current = true;

    			dispose = [
    				listen_dev(window, "mousemove", /*handleUserEvent*/ ctx[21], false, false, false),
    				listen_dev(window, "click", /*handleUserEvent*/ ctx[21], false, false, false),
    				listen_dev(window, "keydown", /*handleUserEvent*/ ctx[21], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			const headline_changes = {};
    			if (dirty & /*message*/ 1) headline_changes.message = /*message*/ ctx[0];
    			if (dirty & /*itemId*/ 2) headline_changes.itemId = /*itemId*/ ctx[1];
    			headline.$set(headline_changes);
    			const list_1_changes = {};
    			if (dirty & /*list*/ 8) list_1_changes.list = /*list*/ ctx[3];
    			if (dirty & /*currentItem*/ 4) list_1_changes.currentItem = /*currentItem*/ ctx[2];
    			list_1.$set(list_1_changes);
    			const userinput_changes = {};
    			if (dirty & /*userInput*/ 32) userinput_changes.userInput = /*userInput*/ ctx[5];
    			if (dirty & /*result*/ 64) userinput_changes.result = /*result*/ ctx[6];
    			userinput.$set(userinput_changes);
    			const table_1_changes = {};
    			if (dirty & /*selected*/ 512) table_1_changes.selected = /*selected*/ ctx[9];
    			if (dirty & /*table*/ 16) table_1_changes.data = /*table*/ ctx[4];
    			table_1.$set(table_1_changes);
    			const radioboxes_changes = {};
    			if (dirty & /*selections*/ 256) radioboxes_changes.selections = /*selections*/ ctx[8];
    			radioboxes.$set(radioboxes_changes);

    			const modaldialog_changes = (dirty & /*modalDialog*/ 128)
    			? get_spread_update(modaldialog_spread_levels, [get_spread_object(/*modalDialog*/ ctx[7])])
    			: {};

    			modaldialog.$set(modaldialog_changes);
    			const modalform_changes = {};
    			if (dirty & /*showFormModal*/ 1024) modalform_changes.showModal = /*showFormModal*/ ctx[10];
    			if (dirty & /*valueName*/ 2048) modalform_changes.valueName = /*valueName*/ ctx[11];
    			if (dirty & /*valueUrl*/ 4096) modalform_changes.valueUrl = /*valueUrl*/ ctx[12];
    			modalform.$set(modalform_changes);
    			if (!current || dirty & /*$elapsed*/ 8192) set_data_dev(t9, /*$elapsed*/ ctx[13]);
    			if ((!current || dirty & /*$elapsed*/ 8192) && t11_value !== (t11_value = (/*$elapsed*/ ctx[13] === 1 ? "second" : "seconds") + "")) set_data_dev(t11, t11_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(headline.$$.fragment, local);
    			transition_in(list_1.$$.fragment, local);
    			transition_in(userinput.$$.fragment, local);
    			transition_in(contenteditable.$$.fragment, local);
    			transition_in(table_1.$$.fragment, local);
    			transition_in(radioboxes.$$.fragment, local);
    			transition_in(modaldialog.$$.fragment, local);
    			transition_in(modalform.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(headline.$$.fragment, local);
    			transition_out(list_1.$$.fragment, local);
    			transition_out(userinput.$$.fragment, local);
    			transition_out(contenteditable.$$.fragment, local);
    			transition_out(table_1.$$.fragment, local);
    			transition_out(radioboxes.$$.fragment, local);
    			transition_out(modaldialog.$$.fragment, local);
    			transition_out(modalform.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			destroy_component(headline);
    			destroy_component(list_1);
    			destroy_component(userinput);
    			destroy_component(contenteditable);
    			destroy_component(table_1);
    			destroy_component(radioboxes);
    			destroy_component(modaldialog);
    			destroy_component(modalform);
    			run_all(dispose);
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
    	let $elapsed;
    	validate_store(elapsed, "elapsed");
    	component_subscribe($$self, elapsed, $$value => $$invalidate(13, $elapsed = $$value));
    	let { message = "Svelte-Starter" } = $$props;
    	let { itemId = "" } = $$props;
    	let { list = [] } = $$props;
    	let { currentItem = 0 } = $$props;
    	let { table = {} } = $$props;
    	let { userInput = "" } = $$props;
    	let { result = "" } = $$props;
    	let { modalDialog = {} } = $$props;
    	let { selections = {} } = $$props;
    	let selected = "";
    	let showFormModal = false;
    	let valueName = "";
    	let valueUrl = "";

    	const listSelection = event => {
    		$$invalidate(0, message = `Clicked item ${event.detail.item.name}`);
    		$$invalidate(1, itemId = `Id: ${event.detail.item.id}`);
    		$$invalidate(9, selected = event.detail.item.name);
    	};

    	const handleClickedRow = event => {
    		$$invalidate(0, message = `Clicked item ${event.detail.name}`);
    		$$invalidate(1, itemId = `Id: ${event.detail.id}`);
    		$$invalidate(9, selected = event.detail.name);
    		$$invalidate(2, currentItem = event.detail.id);
    	};

    	const edit = event => {
    		$$invalidate(11, valueName = event.detail.item.name);
    		$$invalidate(12, valueUrl = event.detail.item.url);
    		$$invalidate(10, showFormModal = true);
    		console.log(event.detail.item);
    	};

    	const closeModal = event => {
    		$$invalidate(10, showFormModal = false);
    	};

    	const handleInput = event => {
    		console.log(event.detail.input);
    	};

    	const sendForm = event => {
    		$$invalidate(10, showFormModal = false);
    		console.log(event.detail);
    	};

    	const handleEvent = event => {
    		console.log(event.detail);
    	};

    	const handleUserEvent = event => {
    		userActivity();
    	};

    	const writable_props = [
    		"message",
    		"itemId",
    		"list",
    		"currentItem",
    		"table",
    		"userInput",
    		"result",
    		"modalDialog",
    		"selections"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("message" in $$props) $$invalidate(0, message = $$props.message);
    		if ("itemId" in $$props) $$invalidate(1, itemId = $$props.itemId);
    		if ("list" in $$props) $$invalidate(3, list = $$props.list);
    		if ("currentItem" in $$props) $$invalidate(2, currentItem = $$props.currentItem);
    		if ("table" in $$props) $$invalidate(4, table = $$props.table);
    		if ("userInput" in $$props) $$invalidate(5, userInput = $$props.userInput);
    		if ("result" in $$props) $$invalidate(6, result = $$props.result);
    		if ("modalDialog" in $$props) $$invalidate(7, modalDialog = $$props.modalDialog);
    		if ("selections" in $$props) $$invalidate(8, selections = $$props.selections);
    	};

    	$$self.$capture_state = () => {
    		return {
    			message,
    			itemId,
    			list,
    			currentItem,
    			table,
    			userInput,
    			result,
    			modalDialog,
    			selections,
    			selected,
    			showFormModal,
    			valueName,
    			valueUrl,
    			$elapsed
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("message" in $$props) $$invalidate(0, message = $$props.message);
    		if ("itemId" in $$props) $$invalidate(1, itemId = $$props.itemId);
    		if ("list" in $$props) $$invalidate(3, list = $$props.list);
    		if ("currentItem" in $$props) $$invalidate(2, currentItem = $$props.currentItem);
    		if ("table" in $$props) $$invalidate(4, table = $$props.table);
    		if ("userInput" in $$props) $$invalidate(5, userInput = $$props.userInput);
    		if ("result" in $$props) $$invalidate(6, result = $$props.result);
    		if ("modalDialog" in $$props) $$invalidate(7, modalDialog = $$props.modalDialog);
    		if ("selections" in $$props) $$invalidate(8, selections = $$props.selections);
    		if ("selected" in $$props) $$invalidate(9, selected = $$props.selected);
    		if ("showFormModal" in $$props) $$invalidate(10, showFormModal = $$props.showFormModal);
    		if ("valueName" in $$props) $$invalidate(11, valueName = $$props.valueName);
    		if ("valueUrl" in $$props) $$invalidate(12, valueUrl = $$props.valueUrl);
    		if ("$elapsed" in $$props) elapsed.set($elapsed = $$props.$elapsed);
    	};

    	return [
    		message,
    		itemId,
    		currentItem,
    		list,
    		table,
    		userInput,
    		result,
    		modalDialog,
    		selections,
    		selected,
    		showFormModal,
    		valueName,
    		valueUrl,
    		$elapsed,
    		listSelection,
    		handleClickedRow,
    		edit,
    		closeModal,
    		handleInput,
    		sendForm,
    		handleEvent,
    		handleUserEvent
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			message: 0,
    			itemId: 1,
    			list: 3,
    			currentItem: 2,
    			table: 4,
    			userInput: 5,
    			result: 6,
    			modalDialog: 7,
    			selections: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get message() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get itemId() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set itemId(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get list() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set list(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get currentItem() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentItem(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get table() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set table(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userInput() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userInput(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get result() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set result(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get modalDialog() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set modalDialog(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selections() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selections(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
      target: document.body,
      props: {
        list: [
          { id: 1, name: 'Svelte', url: 'https://svelte.technology/' },
          { id: 2, name: 'Rollup', url: 'https://rollupjs.org/' },
          { id: 3, name: 'Sapper', url: 'https://sapper.svelte.dev/' },
        ],
        table: {
          header: ['Name', 'URL'],
          entries: [
            { id: 1, name: 'Svelte', url: 'https://svelte.technology/' },
            { id: 2, name: 'Rollup', url: 'https://rollupjs.org/' },
            { id: 3, name: 'Sapper', url: 'https://sapper.svelte.dev/' },
          ],
        },
        modalDialog: {
          showModal: false,
          headline: 'Modal',
          body: 'Modal body text.<br>Plus this.',
        },
        selections: [
          {
            selector: 'A',
            label: 'A',
            text:
              '<p>This is the selection <strong>A</strong>.<br>It shows the information for A.</p>',
          },
          {
            selector: 'B',
            label: 'B',
            text:
              '<p>This is the selection <strong>B</strong>.<br>It shows the information for B.</p>',
          },
          {
            selector: 'C',
            label: 'C',
            text:
              '<p>This is the selection <strong>C</strong>.<br>It shows the information for C.</p>',
          },
        ],
      },
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
