<div on:click="select(item)">
    {{item.name}}
</div>

<style>
div {
    border: 1px solid #ccc;
    margin-bottom: 3px;
    padding: 7px;
    cursor: pointer;
}
</style>

<script type="text/javascript">
export default {
    data () {
        return {
            item: {id: 0, name: ''}
        };
    },
    methods: {
        select (item) {
            this.fire('select', {item: item});
        }
    }
};
</script>
