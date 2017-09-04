<div>
    {{#each list as item}}
        <div>
            <ListItem item="{{item}}"
                      on:select="select(event)">
        </div>
    {{/each}}
</div>

<script type="text/javascript">
import ListItem from './ListItem.svelte';

export default {
    data () {
        return {
            list: []
        };
    },
    methods: {
        select (event) {
            this.fire('select', event);
        }
    },
    components: {
        ListItem
    }
};
</script>
