<h1 class="headline">
    {{message}} <small>{{itemId}}</small>
</h1>

<style>
h1.headline {
    margin-left: 30px;
    font-size: 24pt;
}
h1.headline > small {
    font-size: 12pt;
    color: #bbb;
}
</style>

<script type="text/javascript">
export default {
    data () {
        return {
            message: 'Nothing clicked',
            itemId: ''
        };
    }
};
</script>
