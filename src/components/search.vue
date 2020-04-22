<template>
  <div class="search">
    <form>
      <font-awesome-icon :icon="['fal', 'search']" />
      <input type="text" name="search" v-model="search" :placeholder="placeholder" @focus="placeholder = 'start typing...'" @blur="placeholder = 'search'" autocomplete="off" />
    </form>
  </div>
</template>

<script>
export default {
  name: 'search',
  props: {},
  data: function(){
    return {
      search: this.$store.state.search,
      placeholder: 'search'
    };
  },
  watch: {
    search: function(search){
      this.$store.dispatch('searchChanged', this.search);
      if(this.search != this.$route.query.search) this.$router.replace({query: {search: this.search ? this.search : undefined}});
    }
  },
  mounted: function(){
    if(this.$route.query.search){
      this.$store.dispatch('searchChanged', this.$route.query.search);
      this.search = this.$route.query.search;
    }
  }
}
</script>

<style scoped lang="less">
@import '../assets/less/shared.less';

.search {
  form {
    position: relative;
    display: inline-block;
    font-size: 1.6em;
    > svg {
      position: relative;
      font-size: 0.8em;
      vertical-align: top;
      line-height: 1.4;
      top: 5px;
      left: 0;
    }
    > input {
      display: inline;
      background-color: transparent;
      border: none;
      padding: 0;
      vertical-align: top;
      margin-top: 0;
      margin-left: 15px;
      height: 30px;
      width: 150px;
      &:focus {
        outline: none;
      }
    }
  }
}
</style>
