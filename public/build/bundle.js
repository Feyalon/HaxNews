
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }
    class HtmlTag {
        constructor(is_svg = false) {
            this.is_svg = false;
            this.is_svg = is_svg;
            this.e = this.n = null;
        }
        c(html) {
            this.h(html);
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                if (this.is_svg)
                    this.e = svg_element(target.nodeName);
                else
                    this.e = element(target.nodeName);
                this.t = target;
                this.c(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        set_current_component(saved_component);
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
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function add_classes(classes) {
        return classes ? ` class="${classes}"` : '';
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Summary.svelte generated by Svelte v3.49.0 */

    const file$4 = "src\\Summary.svelte";

    function create_fragment$4(ctx) {
    	let article;
    	let span;
    	let t0_value = /*i*/ ctx[1] + /*offset*/ ctx[2] + 1 + "";
    	let t0;
    	let t1;
    	let h2;
    	let a0;
    	let t2_value = /*item*/ ctx[0].title + "";
    	let t2;
    	let t3;
    	let p;
    	let a1;
    	let t4_value = /*comment_text*/ ctx[4]() + "";
    	let t4;
    	let a1_href_value;
    	let t5;
    	let t6_value = /*item*/ ctx[0].user + "";
    	let t6;
    	let t7;
    	let t8_value = /*item*/ ctx[0].time_ago + "";
    	let t8;

    	const block = {
    		c: function create() {
    			article = element("article");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			h2 = element("h2");
    			a0 = element("a");
    			t2 = text(t2_value);
    			t3 = space();
    			p = element("p");
    			a1 = element("a");
    			t4 = text(t4_value);
    			t5 = text(" by ");
    			t6 = text(t6_value);
    			t7 = space();
    			t8 = text(t8_value);
    			attr_dev(span, "class", "svelte-iq2nst");
    			add_location(span, file$4, 14, 1, 303);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "href", /*url*/ ctx[3]);
    			attr_dev(a0, "class", "svelte-iq2nst");
    			add_location(a0, file$4, 15, 5, 339);
    			attr_dev(h2, "class", "svelte-iq2nst");
    			add_location(h2, file$4, 15, 1, 335);
    			attr_dev(a1, "href", a1_href_value = "#/item/" + /*item*/ ctx[0].id);
    			attr_dev(a1, "class", "svelte-iq2nst");
    			add_location(a1, file$4, 16, 17, 409);
    			attr_dev(p, "class", "meta");
    			add_location(p, file$4, 16, 1, 393);
    			attr_dev(article, "class", "svelte-iq2nst");
    			add_location(article, file$4, 13, 0, 291);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, span);
    			append_dev(span, t0);
    			append_dev(article, t1);
    			append_dev(article, h2);
    			append_dev(h2, a0);
    			append_dev(a0, t2);
    			append_dev(article, t3);
    			append_dev(article, p);
    			append_dev(p, a1);
    			append_dev(a1, t4);
    			append_dev(p, t5);
    			append_dev(p, t6);
    			append_dev(p, t7);
    			append_dev(p, t8);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*i, offset*/ 6 && t0_value !== (t0_value = /*i*/ ctx[1] + /*offset*/ ctx[2] + 1 + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*item*/ 1 && t2_value !== (t2_value = /*item*/ ctx[0].title + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*url*/ 8) {
    				attr_dev(a0, "href", /*url*/ ctx[3]);
    			}

    			if (dirty & /*item*/ 1 && a1_href_value !== (a1_href_value = "#/item/" + /*item*/ ctx[0].id)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*item*/ 1 && t6_value !== (t6_value = /*item*/ ctx[0].user + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*item*/ 1 && t8_value !== (t8_value = /*item*/ ctx[0].time_ago + "")) set_data_dev(t8, t8_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
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
    	let url;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Summary', slots, []);
    	let { item } = $$props;
    	let { i } = $$props;
    	let { offset } = $$props;

    	function comment_text() {
    		const c = item.comments_count;
    		return `${c} ${c === 1 ? 'comment' : 'comments'}`;
    	}

    	const writable_props = ['item', 'i', 'offset'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Summary> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('i' in $$props) $$invalidate(1, i = $$props.i);
    		if ('offset' in $$props) $$invalidate(2, offset = $$props.offset);
    	};

    	$$self.$capture_state = () => ({ item, i, offset, comment_text, url });

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('i' in $$props) $$invalidate(1, i = $$props.i);
    		if ('offset' in $$props) $$invalidate(2, offset = $$props.offset);
    		if ('url' in $$props) $$invalidate(3, url = $$props.url);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*item*/ 1) {
    			$$invalidate(3, url = item.type === "ask"
    			? `https://news.ycombinator.com/${item.url}`
    			: item.url);
    		}
    	};

    	return [item, i, offset, url, comment_text];
    }

    class Summary extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { item: 0, i: 1, offset: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Summary",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !('item' in props)) {
    			console.warn("<Summary> was created without expected prop 'item'");
    		}

    		if (/*i*/ ctx[1] === undefined && !('i' in props)) {
    			console.warn("<Summary> was created without expected prop 'i'");
    		}

    		if (/*offset*/ ctx[2] === undefined && !('offset' in props)) {
    			console.warn("<Summary> was created without expected prop 'offset'");
    		}
    	}

    	get item() {
    		throw new Error("<Summary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Summary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get i() {
    		throw new Error("<Summary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set i(value) {
    		throw new Error("<Summary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get offset() {
    		throw new Error("<Summary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set offset(value) {
    		throw new Error("<Summary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\List.svelte generated by Svelte v3.49.0 */
    const file$3 = "src\\List.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (61:0) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading";
    			add_location(p, file$3, 61, 4, 1662);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(61:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (26:0) {#if items}
    function create_if_block$2(ctx) {
    	let t0;
    	let div;
    	let ul;
    	let li0;
    	let a0;
    	let t2;
    	let li1;
    	let a1;
    	let t4;
    	let li2;
    	let a2;
    	let t6;
    	let li3;
    	let a3;
    	let t8;
    	let li4;
    	let a4;
    	let t10;
    	let li5;
    	let a5;
    	let t12;
    	let li6;
    	let a6;
    	let t14;
    	let li7;
    	let a7;
    	let t16;
    	let li8;
    	let a8;
    	let t18;
    	let li9;
    	let a9;
    	let span;
    	let a9_href_value;
    	let current;
    	let each_value = /*items*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "1";
    			t2 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "2";
    			t4 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "3";
    			t6 = space();
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "4";
    			t8 = space();
    			li4 = element("li");
    			a4 = element("a");
    			a4.textContent = "5";
    			t10 = space();
    			li5 = element("li");
    			a5 = element("a");
    			a5.textContent = "6";
    			t12 = space();
    			li6 = element("li");
    			a6 = element("a");
    			a6.textContent = "7";
    			t14 = space();
    			li7 = element("li");
    			a7 = element("a");
    			a7.textContent = "8";
    			t16 = space();
    			li8 = element("li");
    			a8 = element("a");
    			a8.textContent = "9";
    			t18 = space();
    			li9 = element("li");
    			a9 = element("a");
    			span = element("span");
    			span.textContent = "arrow_forward_ios";
    			attr_dev(a0, "href", "#/top/1");
    			attr_dev(a0, "class", "svelte-1gm06r8");
    			add_location(a0, file$3, 36, 37, 758);
    			attr_dev(li0, "class", "waves-effect");
    			add_location(li0, file$3, 36, 12, 733);
    			attr_dev(a1, "href", "#/top/2");
    			attr_dev(a1, "class", "svelte-1gm06r8");
    			add_location(a1, file$3, 37, 37, 825);
    			attr_dev(li1, "class", "waves-effect");
    			add_location(li1, file$3, 37, 12, 800);
    			attr_dev(a2, "href", "#/top/3");
    			attr_dev(a2, "class", "svelte-1gm06r8");
    			add_location(a2, file$3, 38, 37, 892);
    			attr_dev(li2, "class", "waves-effect");
    			add_location(li2, file$3, 38, 12, 867);
    			attr_dev(a3, "href", "#/top/4");
    			attr_dev(a3, "class", "svelte-1gm06r8");
    			add_location(a3, file$3, 39, 37, 959);
    			attr_dev(li3, "class", "waves-effect");
    			add_location(li3, file$3, 39, 12, 934);
    			attr_dev(a4, "href", "#/top/5");
    			attr_dev(a4, "class", "svelte-1gm06r8");
    			add_location(a4, file$3, 40, 37, 1026);
    			attr_dev(li4, "class", "waves-effect");
    			add_location(li4, file$3, 40, 12, 1001);
    			attr_dev(a5, "href", "#/top/6");
    			attr_dev(a5, "class", "svelte-1gm06r8");
    			add_location(a5, file$3, 41, 37, 1093);
    			attr_dev(li5, "class", "waves-effect");
    			add_location(li5, file$3, 41, 12, 1068);
    			attr_dev(a6, "href", "#/top/7");
    			attr_dev(a6, "class", "svelte-1gm06r8");
    			add_location(a6, file$3, 42, 37, 1160);
    			attr_dev(li6, "class", "waves-effect");
    			add_location(li6, file$3, 42, 12, 1135);
    			attr_dev(a7, "href", "#/top/8");
    			attr_dev(a7, "class", "svelte-1gm06r8");
    			add_location(a7, file$3, 43, 37, 1227);
    			attr_dev(li7, "class", "waves-effect");
    			add_location(li7, file$3, 43, 12, 1202);
    			attr_dev(a8, "href", "#/top/9");
    			attr_dev(a8, "class", "svelte-1gm06r8");
    			add_location(a8, file$3, 44, 37, 1294);
    			attr_dev(li8, "class", "waves-effect");
    			add_location(li8, file$3, 44, 12, 1269);
    			attr_dev(span, "class", "material-symbols-outlined");
    			add_location(span, file$3, 46, 64, 1402);
    			attr_dev(a9, "href", a9_href_value = "#/top/" + (/*page*/ ctx[0] + 1));
    			attr_dev(a9, "class", "svelte-1gm06r8");
    			add_location(a9, file$3, 46, 37, 1375);
    			attr_dev(li9, "class", "waves-effect");
    			add_location(li9, file$3, 46, 12, 1350);
    			attr_dev(ul, "class", "pagination");
    			add_location(ul, file$3, 32, 8, 650);
    			add_location(div, file$3, 31, 4, 635);
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t2);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(ul, t4);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(ul, t6);
    			append_dev(ul, li3);
    			append_dev(li3, a3);
    			append_dev(ul, t8);
    			append_dev(ul, li4);
    			append_dev(li4, a4);
    			append_dev(ul, t10);
    			append_dev(ul, li5);
    			append_dev(li5, a5);
    			append_dev(ul, t12);
    			append_dev(ul, li6);
    			append_dev(li6, a6);
    			append_dev(ul, t14);
    			append_dev(ul, li7);
    			append_dev(li7, a7);
    			append_dev(ul, t16);
    			append_dev(ul, li8);
    			append_dev(li8, a8);
    			append_dev(ul, t18);
    			append_dev(ul, li9);
    			append_dev(li9, a9);
    			append_dev(a9, span);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items, offset*/ 6) {
    				each_value = /*items*/ ctx[1];
    				validate_each_argument(each_value);
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
    						each_blocks[i].m(t0.parentNode, t0);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*page*/ 1 && a9_href_value !== (a9_href_value = "#/top/" + (/*page*/ ctx[0] + 1))) {
    				attr_dev(a9, "href", a9_href_value);
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
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(26:0) {#if items}",
    		ctx
    	});

    	return block;
    }

    // (27:1) {#each items as item, i}
    function create_each_block$2(ctx) {
    	let summary;
    	let current;

    	summary = new Summary({
    			props: {
    				item: /*item*/ ctx[4],
    				i: /*i*/ ctx[6],
    				offset: /*offset*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(summary.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(summary, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const summary_changes = {};
    			if (dirty & /*items*/ 2) summary_changes.item = /*item*/ ctx[4];
    			if (dirty & /*offset*/ 4) summary_changes.offset = /*offset*/ ctx[2];
    			summary.$set(summary_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(summary.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(summary.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(summary, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(27:1) {#each items as item, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*items*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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

    const PAGE_SIZE = 20;

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('List', slots, []);
    	let { page } = $$props;
    	let items;
    	let offset;
    	let select = false;

    	if (select == true) {
    		classList.add(".active");
    	}

    	const writable_props = ['page'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('page' in $$props) $$invalidate(0, page = $$props.page);
    	};

    	$$self.$capture_state = () => ({
    		beforeUpdate,
    		add_classes,
    		svg_element,
    		Summary,
    		PAGE_SIZE,
    		page,
    		items,
    		offset,
    		select
    	});

    	$$self.$inject_state = $$props => {
    		if ('page' in $$props) $$invalidate(0, page = $$props.page);
    		if ('items' in $$props) $$invalidate(1, items = $$props.items);
    		if ('offset' in $$props) $$invalidate(2, offset = $$props.offset);
    		if ('select' in $$props) select = $$props.select;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*page*/ 1) {
    			fetch(`https://node-hnapi.herokuapp.com/news?page=${page}`).then(r => r.json()).then(data => {
    				$$invalidate(1, items = data);
    				$$invalidate(2, offset = PAGE_SIZE * (page - 1));
    				window.scrollTo(0, 0);
    			});
    		}
    	};

    	return [page, items, offset];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { page: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*page*/ ctx[0] === undefined && !('page' in props)) {
    			console.warn("<List> was created without expected prop 'page'");
    		}
    	}

    	get page() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Comment.svelte generated by Svelte v3.49.0 */

    const file$2 = "src\\Comment.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (11:2) {#each comment.comments as child}
    function create_each_block$1(ctx) {
    	let comment_1;
    	let current;

    	comment_1 = new Comment({
    			props: { comment: /*child*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(comment_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(comment_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const comment_1_changes = {};
    			if (dirty & /*comment*/ 1) comment_1_changes.comment = /*child*/ ctx[1];
    			comment_1.$set(comment_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(comment_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(comment_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(comment_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(11:2) {#each comment.comments as child}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let article;
    	let p;
    	let t0_value = /*comment*/ ctx[0].user + "";
    	let t0;
    	let t1;
    	let t2_value = /*comment*/ ctx[0].time_ago + "";
    	let t2;
    	let t3;
    	let html_tag;
    	let raw_value = /*comment*/ ctx[0].content + "";
    	let t4;
    	let div;
    	let current;
    	let each_value = /*comment*/ ctx[0].comments;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			article = element("article");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			html_tag = new HtmlTag(false);
    			t4 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(p, "class", "meta svelte-1v1ma1k");
    			add_location(p, file$2, 5, 1, 57);
    			html_tag.a = t4;
    			attr_dev(div, "class", "replies svelte-1v1ma1k");
    			add_location(div, file$2, 9, 1, 143);
    			attr_dev(article, "class", "svelte-1v1ma1k");
    			add_location(article, file$2, 4, 0, 45);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(article, t3);
    			html_tag.m(raw_value, article);
    			append_dev(article, t4);
    			append_dev(article, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*comment*/ 1) && t0_value !== (t0_value = /*comment*/ ctx[0].user + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*comment*/ 1) && t2_value !== (t2_value = /*comment*/ ctx[0].time_ago + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*comment*/ 1) && raw_value !== (raw_value = /*comment*/ ctx[0].content + "")) html_tag.p(raw_value);

    			if (dirty & /*comment*/ 1) {
    				each_value = /*comment*/ ctx[0].comments;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
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
    			if (detaching) detach_dev(article);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Comment', slots, []);
    	let { comment } = $$props;
    	const writable_props = ['comment'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Comment> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('comment' in $$props) $$invalidate(0, comment = $$props.comment);
    	};

    	$$self.$capture_state = () => ({ comment });

    	$$self.$inject_state = $$props => {
    		if ('comment' in $$props) $$invalidate(0, comment = $$props.comment);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [comment];
    }

    class Comment extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { comment: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Comment",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*comment*/ ctx[0] === undefined && !('comment' in props)) {
    			console.warn("<Comment> was created without expected prop 'comment'");
    		}
    	}

    	get comment() {
    		throw new Error("<Comment>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set comment(value) {
    		throw new Error("<Comment>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Item.svelte generated by Svelte v3.49.0 */
    const file$1 = "src\\Item.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (15:2) {#if item.domain}
    function create_if_block$1(ctx) {
    	let small;
    	let t_value = /*item*/ ctx[0].domain + "";
    	let t;

    	const block = {
    		c: function create() {
    			small = element("small");
    			t = text(t_value);
    			add_location(small, file$1, 15, 3, 310);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, small, anchor);
    			append_dev(small, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t_value !== (t_value = /*item*/ ctx[0].domain + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(small);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(15:2) {#if item.domain}",
    		ctx
    	});

    	return block;
    }

    // (24:1) {#each item.comments as comment}
    function create_each_block(ctx) {
    	let comment;
    	let current;

    	comment = new Comment({
    			props: { comment: /*comment*/ ctx[3] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(comment.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(comment, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const comment_changes = {};
    			if (dirty & /*item*/ 1) comment_changes.comment = /*comment*/ ctx[3];
    			comment.$set(comment_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(comment.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(comment.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(comment, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(24:1) {#each item.comments as comment}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let a0;
    	let t0;
    	let t1;
    	let article;
    	let a1;
    	let h1;
    	let t2_value = /*item*/ ctx[0].title + "";
    	let t2;
    	let t3;
    	let t4;
    	let p;
    	let t5;
    	let t6_value = /*item*/ ctx[0].user + "";
    	let t6;
    	let t7;
    	let t8_value = /*item*/ ctx[0].time_ago + "";
    	let t8;
    	let t9;
    	let div;
    	let current;
    	let if_block = /*item*/ ctx[0].domain && create_if_block$1(ctx);
    	let each_value = /*item*/ ctx[0].comments;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			a0 = element("a");
    			t0 = text("« back");
    			t1 = space();
    			article = element("article");
    			a1 = element("a");
    			h1 = element("h1");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block) if_block.c();
    			t4 = space();
    			p = element("p");
    			t5 = text("submitted by ");
    			t6 = text(t6_value);
    			t7 = space();
    			t8 = text(t8_value);
    			t9 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(a0, "href", /*returnTo*/ ctx[1]);
    			attr_dev(a0, "class", "svelte-1e3h4bj");
    			add_location(a0, file$1, 9, 0, 192);
    			attr_dev(h1, "class", "svelte-1e3h4bj");
    			add_location(h1, file$1, 13, 2, 263);
    			attr_dev(a1, "href", /*url*/ ctx[2]);
    			attr_dev(a1, "class", "svelte-1e3h4bj");
    			add_location(a1, file$1, 12, 1, 243);
    			attr_dev(p, "class", "meta");
    			add_location(p, file$1, 19, 1, 359);
    			attr_dev(article, "class", "svelte-1e3h4bj");
    			add_location(article, file$1, 11, 0, 231);
    			attr_dev(div, "class", "comments");
    			add_location(div, file$1, 22, 0, 431);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a0, anchor);
    			append_dev(a0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, article, anchor);
    			append_dev(article, a1);
    			append_dev(a1, h1);
    			append_dev(h1, t2);
    			append_dev(a1, t3);
    			if (if_block) if_block.m(a1, null);
    			append_dev(article, t4);
    			append_dev(article, p);
    			append_dev(p, t5);
    			append_dev(p, t6);
    			append_dev(p, t7);
    			append_dev(p, t8);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*returnTo*/ 2) {
    				attr_dev(a0, "href", /*returnTo*/ ctx[1]);
    			}

    			if ((!current || dirty & /*item*/ 1) && t2_value !== (t2_value = /*item*/ ctx[0].title + "")) set_data_dev(t2, t2_value);

    			if (/*item*/ ctx[0].domain) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(a1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty & /*url*/ 4) {
    				attr_dev(a1, "href", /*url*/ ctx[2]);
    			}

    			if ((!current || dirty & /*item*/ 1) && t6_value !== (t6_value = /*item*/ ctx[0].user + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty & /*item*/ 1) && t8_value !== (t8_value = /*item*/ ctx[0].time_ago + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*item*/ 1) {
    				each_value = /*item*/ ctx[0].comments;
    				validate_each_argument(each_value);
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
    						each_blocks[i].m(div, null);
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
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(article);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
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
    	let url;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Item', slots, []);
    	let { item } = $$props;
    	let { returnTo } = $$props;
    	const writable_props = ['item', 'returnTo'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('returnTo' in $$props) $$invalidate(1, returnTo = $$props.returnTo);
    	};

    	$$self.$capture_state = () => ({ Comment, item, returnTo, url });

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('returnTo' in $$props) $$invalidate(1, returnTo = $$props.returnTo);
    		if ('url' in $$props) $$invalidate(2, url = $$props.url);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*item*/ 1) {
    			$$invalidate(2, url = !item.domain
    			? `https://news.ycombinator.com/${item.url}`
    			: item.url);
    		}
    	};

    	return [item, returnTo, url];
    }

    class Item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { item: 0, returnTo: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !('item' in props)) {
    			console.warn("<Item> was created without expected prop 'item'");
    		}

    		if (/*returnTo*/ ctx[1] === undefined && !('returnTo' in props)) {
    			console.warn("<Item> was created without expected prop 'returnTo'");
    		}
    	}

    	get item() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get returnTo() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set returnTo(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.49.0 */

    const { window: window_1 } = globals;
    const file = "src\\App.svelte";

    // (45:16) 
    function create_if_block_1(ctx) {
    	let list;
    	let current;

    	list = new List({
    			props: { page: /*page*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(list.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(list, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const list_changes = {};
    			if (dirty & /*page*/ 2) list_changes.page = /*page*/ ctx[1];
    			list.$set(list_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(list.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(list.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(list, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(45:16) ",
    		ctx
    	});

    	return block;
    }

    // (43:1) {#if item}
    function create_if_block(ctx) {
    	let item_1;
    	let current;

    	item_1 = new Item({
    			props: {
    				item: /*item*/ ctx[0],
    				returnTo: "#/top/" + /*page*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(item_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(item_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const item_1_changes = {};
    			if (dirty & /*item*/ 1) item_1_changes.item = /*item*/ ctx[0];
    			if (dirty & /*page*/ 2) item_1_changes.returnTo = "#/top/" + /*page*/ ctx[1];
    			item_1.$set(item_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(item_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(item_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(item_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(43:1) {#if item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let header;
    	let h1;
    	let t1;
    	let br;
    	let t2;
    	let a;
    	let t4;
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[0]) return 0;
    		if (/*page*/ ctx[1]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "Hello Coder";
    			t1 = text("\n\tWelcome to HaxNews\n\t");
    			br = element("br");
    			t2 = space();
    			a = element("a");
    			a.textContent = "Source code";
    			t4 = space();
    			main = element("main");
    			if (if_block) if_block.c();
    			add_location(h1, file, 31, 1, 694);
    			add_location(br, file, 33, 1, 736);
    			attr_dev(a, "class", "waves-effect waves-orange btn-flat svelte-1ghdxzr");
    			attr_dev(a, "href", "");
    			add_location(a, file, 35, 1, 744);
    			add_location(header, file, 30, 0, 684);
    			attr_dev(main, "class", "svelte-1ghdxzr");
    			add_location(main, file, 40, 0, 831);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			append_dev(header, t1);
    			append_dev(header, br);
    			append_dev(header, t2);
    			append_dev(header, a);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, main, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window_1, "hashchange", /*hashchange*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				} else {
    					if_block = null;
    				}
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
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(main);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			mounted = false;
    			dispose();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let item; // Import items a = 1;
    	let page;

    	async function hashchange() {
    		// the poor man's router!
    		const path = window.location.hash.slice(1);

    		if (path.startsWith('/item')) {
    			const id = path.slice(6);
    			$$invalidate(0, item = await fetch(`https://node-hnapi.herokuapp.com/item/${id}`).then(r => r.json()));
    			window.scrollTo(0, 0);
    		} else if (path.startsWith('/top')) {
    			$$invalidate(1, page = +path.slice(5));
    			$$invalidate(0, item = null);
    		} else {
    			window.location.hash = '/top/1';
    		}
    	}

    	onMount(hashchange);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		List,
    		Item,
    		item,
    		page,
    		hashchange
    	});

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('page' in $$props) $$invalidate(1, page = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, page, hashchange];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
