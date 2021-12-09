'use strict';

const units = require('../../units.js')();


function min_array(arr, ignore) {
  return arr.filter(entry => entry !== ignore).reduce( (previous, current) => (previous === undefined)?current:Math.min(current, previous), undefined);
}

function max_array(arr, ignore) {
  return arr.filter(entry => entry !== ignore).reduce( (previous, current) => (previous === undefined)?current:Math.max(current, previous), undefined);
}



function configure (app, wares, ctx, env) {
  const entries = ctx.entries;
  const HIGH=401;
  const LOW=39;
  const ARROW_ICON_IDS={
    "NONE":              "39552",
    'NOT COMPUTABLE':    "39562",
    'RATE OUT OF RANGE': "39552",
    "DoubleUp":          "39550",
    "SingleUp":          "39545",
    "FortyFiveUp":       "39549",
    "Flat":              "39547",
    "FortyFiveDown":     "39548",
    "SingleDown":        "39546",
    "DoubleDown":        "39551"
  };
  const CHART_WIDTH=37;
  const CHART_COLUMN_WIDTH=5*60*1000; // 5m

  var express = require('express')
    , api = express.Router( );

  var translate = ctx.language.translate;

  // invoke common middleware
  api.use(wares.sendJSONStatus);
  // text body types get handled as raw buffer stream
  api.use(wares.bodyParser.raw());
  // json body types get handled as parsed json
  api.use(wares.bodyParser.json());


  api.get(
    '/lametric',
    ctx.authorization.isPermitted('api:*:read'),
    function (req, res, next) {
      const payload = get_lametric(req,res);
      res.json(payload)
      return next();
    }
  );

    /*
    var locale = req.body.queryResult.languageCode;
    if(locale){
      if(locale.length > 2) {
        locale = locale.substr(0, 2);
      }
      ctx.language.set(locale);
      moment.locale(locale);
    }
    */

  function icon_for_trend(trend){
    if (trend in ARROW_ICON_IDS) return ARROW_ICON_IDS[trend];
    return ARROW_ICON_IDS['NOT COMPUTABLE'];
  }

  function icon_for_entry(entry) {
    if (entry) return icon_for_trend(entry.direction)
    return ARROW_ICON_IDS['NOT COMPUTABLE'];
  }

  function get_lametric(req,res) {
    const sbx = initializeSandbox(env, ctx);
    let payload = {
      "frames": [
        frame_latest(req,sbx),
        frame_history(req, sbx)
      ]
    }
    res.json(payload);
  }

  function frame_latest_no_data() {
    return {
      "icon": icon_for_trend('NONE'),
      "text": 'No data'
    };
  }


  function frame_latest(req, sbx) {
    if (sbx.data.sgvs.length === 0) {
      return frame_latest_no_data();
    }
/*    console.log("Number of data items: "+sbx.data.sgvs.length.toString());
    {
      let min;
      let max;
      sbx.data.sgvs.forEach(entry=> {
        if (!min || min > entry.mills) min=entry.mills
        if (!max || max < entry.mills) max=entry.mills
      });
      console.log('From: '+(new Date(min)).toISOString());
      console.log('To: '+(new Date(max)).toISOString());
    }*/
    const last_scaled_entry = sbx.lastSGVEntry();

    if (!last_scaled_entry) {
      return frame_latest_no_data();
    }

    if (!sbx.isCurrent(last_scaled_entry)) {
      return frame_latest_no_data();
    }
    let number = sbx.displayBg(last_scaled_entry).toString();
    if (/^\d+$/.test(number)) number += ".0";
    

    
    return {
      'icon': icon_for_entry(last_scaled_entry),
      'text': number
    };
  }


  function entry_chart_height(entry, min, max) {
    let mgdl = Number(entry.mgdl);
    if (mgdl <= min) return 1;
    if (mgdl >= max) return max-min;
    mgdl = mgdl - min;
    return mgdl;
  }

  function frame_history(req, sbx) {
    let min = ('min' in req.query)?units.mmolToMgdl(Number(req.query.min)):LOW;
    let max = ('max' in req.query)?units.mmolToMgdl(Number(req.query.max)):HIGH;
    if (min < LOW) min=LOW;
    if (max > HIGH) max=HIGH

    if (sbx.data.sgvs.length === 0) {
      return frame_latest_no_data();
    }
    const entries = sbx.lastNEntries(sbx.data.sgvs, CHART_WIDTH-1);
    const sbxdate = sbx.time;
    /*
    const entries =  [ { mgdl: 94,
      mills: 1597074539000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 92,
      mills: 1597074839000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 90,
      mills: 1597075139000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 89,
      mills: 1597075439000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 90,
      mills: 1597075739000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 90,
      mills: 1597076039000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 89,
      mills: 1597076339000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 88,
      mills: 1597076639000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 87,
      mills: 1597076939000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 88,
      mills: 1597077239000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 88,
      mills: 1597077539000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 87,
      mills: 1597077839000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 87,
      mills: 1597078139000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 88,
      mills: 1597078439000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 91,
      mills: 1597078739000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 93,
      mills: 1597079039000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 92,
      mills: 1597079339000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 92,
      mills: 1597079639000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 93,
      mills: 1597079938000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 96,
      mills: 1597080239000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 98,
      mills: 1597080539000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 97,
      mills: 1597080839000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 102,
      mills: 1597081139000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 106,
      mills: 1597081439000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 107,
      mills: 1597081739000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 107,
      mills: 1597082039000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 108,
      mills: 1597082339000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 109,
      mills: 1597082639000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 112,
      mills: 1597082939000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 115,
      mills: 1597083239000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 115,
      mills: 1597083539000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 112,
      mills: 1597083839000,
      device: 'share2',
      direction: 'Flat',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 98,
      mills: 1597084139000,
      device: 'share2',
      direction: 'NOT COMPUTABLE',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 77,
      mills: 1597084439000,
      device: 'share2',
      direction: 'NOT COMPUTABLE',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 51,
      mills: 1597084739000,
      device: 'share2',
      direction: 'NOT COMPUTABLE',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined },
    { mgdl: 102,
      mills: 1597086540000,
      device: 'share2',
      direction: 'NOT COMPUTABLE',
      filtered: undefined,
      unfiltered: undefined,
      noise: undefined,
      rssi: undefined,
      scaled: '5.7' } ];
    let sbxdate = 1597086975000;
    */
    if (!entries.length) return frame_latest_no_data();
    const missing={};
    
    let buckets=new Array(CHART_WIDTH-1).fill(missing);

    entries.forEach(entry => {
      let time_since = sbxdate - entry.mills;
      let bucket = CHART_WIDTH- 1 - Math.round(time_since/CHART_COLUMN_WIDTH);
      if (bucket >= (CHART_WIDTH-1)) return;
      if (bucket < 0) return;
      buckets[bucket] = entry_chart_height(entry, min, HIGH);
    })



    buckets = [max-min].concat(buckets);

    buckets = buckets.map( entry => (entry===missing)?9223372036854775807:entry);
    
    return {
      "chartData": buckets
      //entries.map(entry=>entry_chart_height(entry, min, max)))
    }
  }

  function initializeSandbox(env, ctx) {
    var sbx = require('../../sandbox')();
    sbx.serverInit(env, ctx);
    ctx.plugins.setProperties(sbx);
    //ctx.plugins('bgnow').setProperties(sbx);
    return sbx;
  }
  return api;

}

module.exports = configure;
