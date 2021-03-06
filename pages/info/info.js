// pages/info/info.js
Page({

  /**
   * initial page
   */
  data: {
    author:"",
    steemitname:"",
    about:"'",
    location:"",
    avatar: "",
    reputation:"",
    balance:"",
    sbd_balance:"",
    vesting_shares:"",
    voting_power:"",
    created:"",
    postkey:"",
    activekey:"",
    ownerkey:"",
    memokey:"",
    account_auths:[],
    hidden:false,
    steem_power:"",
    delegated_steem_power:"",
    post_button:"show",
    active_button: "show",
    memo_button: "show",
    owner_button: "show",
    post_key_hid:true,
    active_key_hid: true,
    owner_key_hid: true,
    memo_key_hid: true,
    average_market_bandwidth:0,
    available_bandwidth:0,
  },

  /**
   * Life cycle function - listen to page load.
   */
  onLoad: function (options) {
    var account = wx.getStorageSync('name');
    var passwd = wx.getStorageSync('pass')
    this.setData({account:account});
    if (passwd == '' ){
      console.log("No passwd");
      wx.redirectTo({
        url: '../login/login',
      })
    }
    else{
      console.log("check validity")
      var that = this;
      wx.request({
        url: 'https://openjoy.club/operation/wif_is_valid?account=' + account + '&key=' + passwd,
        method: 'GET',
        success: function (res) {
          console.log(res.data);
          that.setData({ hidden: true });
          if (res.statusCode == '200' && res.data.message == 'success') {
            wx.request({
              // testing the hostname
              url: 'https://openjoy.club/transmit/redir?uri=https://steemit.com/@' + account + '.json',
              method: 'GET',
              success: function (res) {
                console.log(res);
                if (res.data.status == '200') {
                  that.vests_to_sp(parseFloat(res.data.user.vesting_shares), parseFloat(res.data.user.delegated_vesting_shares));
                  that.get_follower_following();
                  that.setData({
                    avatar: res.data.user.json_metadata.profile.profile_image,
                    balance: res.data.user.balance,
                    created: res.data.user.created,
                    post_count: res.data.user.post_count,
                    sbd_balance: res.data.user.sbd_balance,
                    vesting_shares: parseInt(res.data.user.vesting_shares),
                    voting_power: String(res.data.user.voting_power).substr(0, 2),
                    reputation: that.getReputation(res.data.user.reputation),
                    average_market_bandwidth: res.data.user.average_market_bandwidth,
                    author: res.data.user.name,
                    steemitname: res.data.user.json_metadata.profile.name,
                    about: res.data.user.json_metadata.profile.about,
                    location: res.data.user.json_metadata.profile.location,
                    postkey: res.data.user.posting.key_auths[0][0],
                    activekey: res.data.user.active.key_auths[0][0],
                    ownerkey: res.data.user.owner.key_auths[0][0],
                    memokey: res.data.user.memo_key,
                    account_auths: res.data.user.posting.account_auths,
                    witness_votes: res.data.user.witness_votes,
                    hidden: true



                  })
                }
                that.calc_bandwidth();
              },
              complete: function (res) {
                var transactionHistory = [];
                wx.request({
                  url: 'https://openjoy.club/transmit/redir?uri=https://uploadbeta.com/api/steemit/transfer-history/?id=' + account,
                  method: 'GET',
                  success: function (res) {
                    if (res.statusCode == '200') {
                      var transactionDatas = res.data;
                      for (var transactionData in transactionDatas) {
                        var obj = new Object();
                        obj.time = transactionDatas[transactionData].time_desc;
                        obj.transaction = transactionDatas[transactionData].transaction;
                        obj.memo = transactionDatas[transactionData].memo;
                        transactionHistory.push(obj);
                      }
                    }
                    console.log(transactionHistory);
                    that.setData({ transactions: transactionHistory })
                  }
                })
              }
            })

          }
          else {
            wx.showToast({
              title: 'Login Fail',
              icon: 'none',
              duration: 2000
            })
            wx.redirectTo({
              url: '../login/login',
            })
          }
        }
      })
      

    }
     
  },

  /**
   * Life cycle function - the first rendering of the listening page.
   */
  onReady: function () {
  
  },

  /**
   * Life cycle function - monitor page display.
   */
  onShow: function () {
  
  },

  /**
   *Life cycle function - the listening page is hidden.
   */
  onHide: function () {
  
  },

  /**
   *Life cycle function - monitor page uninstall.
   */
  onUnload: function () {
  
  },

  /**
   * Page correlation event handler - listen to the user to pull.
   */
  onPullDownRefresh: function () {
    this.setData({ hidden: false})
    this.onLoad();
  
  },

  /**
   * The handle function of the bottom event on the page.
   */
  onReachBottom: function () {
  
  },

  /**
   * Users click the top right corner to share.
   */
  onShareAppMessage: function () {
    return {
      title: this.data.account + ' Profile',
      desc: "Steemit",
      path: '/pages/post/post?sharePage=profile&account=' + this.data.account
    }
  
  },

  // convert into reputation
  getReputation(rep) {
    if (rep == 0) {
      return 25
    }
    var score = (Math.log10(Math.abs(rep)) - 9) * 9 + 25;
    if (rep < 0) {
      score = 50 - score;
    }
    return Math.round(score);
  },

  vests_to_sp(vests,dvests){
    var that =this;
    var total_vesting_fund_steem=0;
    var total_vesting_shares=0;
    var sp=0;
    var d_sp=0;
    console.log(vests);
    wx.request({
      url: 'https://openjoy.club/general/get_state?path=/@' + that.data.account,
      method: 'GET',
      success: function (res) {
        console.log(res);
        if (res.statusCode == '200') {
             total_vesting_fund_steem= parseFloat(res.data.props.total_vesting_fund_steem);
             total_vesting_shares=  parseFloat(res.data.props.total_vesting_shares);
             sp= vests / 1000000 * total_vesting_fund_steem / (total_vesting_shares / 1000000);
             d_sp = dvests / 1000000 * total_vesting_fund_steem / (total_vesting_shares / 1000000);
        }      
        console.log(total_vesting_shares);
        that.setData({ steem_power: sp.toFixed(2), delegated_steem_power:d_sp.toFixed(2)})
      }
    })
    
  },
  
  // deal with the click button action to show or hide the keys 
  show_hid:function(e){
    var type_key = e.currentTarget.dataset.type;
    console.log(type_key);
    switch(type_key){
      case "post":
        var button_state = this.data.post_button;
        var key_state = this.data.post_key_hid;
        this.setData({ post_button: button_state =='show' ? 'hidden' : 'show' , post_key_hid: !key_state});
        break;
      case "active":
        var button_state = this.data.active_button;
        var key_state = this.data.active_key_hid;
        this.setData({ active_button: button_state == 'show' ? 'hidden' : 'show', active_key_hid: !key_state });
        break;
      case "owner":
        var button_state = this.data.owner_button;
        var key_state = this.data.owner_key_hid;
        this.setData({ owner_button: button_state == 'show' ? 'hidden' : 'show', owner_key_hid: !key_state });
        break;
      case "memo":
        var button_state = this.data.memo_button;
        var key_state = this.data.memo_key_hid;
        this.setData({ memo_button: button_state == 'show' ? 'hidden' : 'show', memo_key_hid: !key_state });
        break;
    }
  },
  // get the steemit account followers and followings number
  get_follower_following() {
    var that = this;
    wx.request({
      url: 'https://openjoy.club/account/get_follow_count?account=' + that.data.account,
      method: 'GET',
      success: function (res) {
        console.log(res);
        if (res.statusCode == '200') {
          that.setData({ follower: res.data.follower_count, following: res.data.following_count })
        }        
      }
    })

  },
  // calculate the available bandwidth
  calc_bandwidth(){
    var that = this;
    var max_virtual_bandwidth = 0;
    var available_bandwidth= 0;
    wx.request({
      url: 'https://openjoy.club/general/get_dynamic_global_properties',
      method: 'GET',
      success: function (res) {
        console.log(res);
        console.log(that.data.average_market_bandwidth);
        if (res.statusCode == '200') {
          max_virtual_bandwidth = res.data.max_virtual_bandwidth;
          available_bandwidth = parseInt((max_virtual_bandwidth - that.data.average_market_bandwidth) / max_virtual_bandwidth *100) ;
          that.setData({ available_bandwidth: available_bandwidth})
        }
      }
    })
  },
  // deal with the click on the follwers number
  show_follow: function (e) {
    var follow_type = e.currentTarget.dataset.type;
    var author = this.data.author;
    var follower = this.data.follower;
    var following = this.data.following;
    console.log(follow_type);
    wx.navigateTo({
      url: '../follow/follow?author=' + author + '&type=' + follow_type + '&follower='+ follower + '&following='+following,
    })
  },
  show_authorPost:function(e){
    var author = this.data.author;
    console.log("navigate to authore posts showing list");
    wx.navigateTo({
      url: '../authorPost/authorPost?author=' + author ,
    })
  },
  voteHistory:function(e){
    var author = this.data.author;
    console.log("navigate to voting history");
    wx.navigateTo({
      url: '../voteHistory/voteHistory?author=' + author,
    })
  },
  feed: function (e) {
    var author = this.data.author;
    console.log("navigate to feed showing");
    wx.navigateTo({
      url: '../feed/feed?author=' + author,
    })
  },
  commentsHistory: function (e) {
    var author = this.data.author;
    console.log("navigate to voting history");
    wx.navigateTo({
      url: '../commentsHistory/commentsHistory?author=' + author,
    })
  },
  replyHistory: function (e) {
    var author = this.data.author;
    console.log("navigate to reply history");
    wx.navigateTo({
      url: '../replyHistory/replyHistory?author=' + author,
    })
  },

  clickAvatar:function(){
    var that =this;
    wx.showModal({
      title: 'LogOut',
      content: 'Are you sure to log out',
      success: function (res) {
        if (res.confirm) {
          console.log('confirm log out')
          wx.removeStorageSync('name')
          wx.removeStorageSync('pass')
          that.onLoad();
        } else if (res.cancel) {
          console.log('cancel the log out ')
        }
      }
    })
  },
  favorites:function(e){
    var author = this.data.author;
    console.log("navigate to reply history");
    wx.navigateTo({
      url: '../favouritePost/favouritePost?author=' + author,
    })
  },
  // deal with the clicking on othe setting button
  clickSetting:function(e){
    wx.navigateTo({
      url: '../gestureSetting/gestureSetting'
    })
  },

   // deal with the clicking on othe postEditor button
  clickPost: function (e) {
    wx.navigateTo({
      url: '../postEditor/postEditor'
    })
  }

})