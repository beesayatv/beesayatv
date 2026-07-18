jQuery(function($){
 let running=false;
 function call(action,data){return $.post(BTVLC.ajax,$.extend({action:'btv_lc_'+action,nonce:BTVLC.nonce},data||{}));}
 function batch(){if(!running)return;call('batch').done(function(r){if(!r.success){running=false;return;}let s=r.data.state||{};$('#btv-lc-progress').text('Processed '+(s.cursor||s.total||0)+' of '+(s.total||0)+' posts.');if(r.data.done){running=false;$('#btv-lc-stop').prop('disabled',true);$('#btv-lc-progress').text('Scan complete. Refreshing results…');window.location.reload();}else{batch();}}).fail(function(){running=false;$('#btv-lc-progress').text('Scan paused because a request failed.');});}
 $('#btv-lc-start').on('click',function(){if(running)return;$(this).prop('disabled',true);call('start').done(function(r){if(r.success){running=true;$('#btv-lc-stop').prop('disabled',false);batch();}});});
 $('#btv-lc-stop').on('click',function(){running=false;call('stop');$(this).prop('disabled',true);$('#btv-lc-progress').text('Scan stopped. Existing results are retained.');});
 $(document).on('click','.btv-lc-recheck-occurrence,.btv-lc-recheck-url',function(){let b=$(this),action=b.hasClass('btv-lc-recheck-occurrence')?'recheck_occurrence':'recheck_url';b.prop('disabled',true);call(action,{id:b.data('id')}).always(function(){window.location.reload();});});
});
