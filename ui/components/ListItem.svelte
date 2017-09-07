<li on:click="select(item)">
    {{item.name}}
</li>

<style>
li {
    border: 1px solid #ccc;
    margin-bottom: 3px;
    padding: 7px;
    width: 70%;
    font-size: 14pt;
    cursor: pointer;
}
li:hover {
    background-color: #eee;
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
