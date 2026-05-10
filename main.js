/* ── Year ── */
var yrEl = document.getElementById('yr');
if (yrEl) yrEl.textContent = new Date().getFullYear();

/* ── Nav active link ── */
(function() {
  var page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function(a) {
    var href = a.getAttribute('href') || '';
    if (href === page || (page === 'index.html' && href === '/') || href === './' + page) {
      a.classList.add('active');
    }
  });
})();

/* ── Hamburger ── */
var navToggle = document.querySelector('.nav-toggle');
var navLinks  = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', function() {
    var open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
  });
  navLinks.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function() {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ── Application form (careers page) ── */
(function() {
  var form = document.getElementById('applyForm');
  if (!form) return;

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var VALID_ROLES = ['ABAP Lead Developer','Technical Project Manager','BRIM / RAR Consultant','FICO Functional Consultant','SAP Integration Architect','Other / Speculative Application'];
  var VALID_EXP  = ['1-3','3-5','5-8','8-12','12+'];
  var applyBtn    = document.getElementById('applyBtn');
  var banner      = document.getElementById('applyBanner');
  var success     = document.getElementById('applySuccess');

  function showBanner(msg){ banner.textContent=msg; banner.className='apply-banner error'; }
  function clearBanner(){ banner.className='apply-banner'; banner.textContent=''; }

  function setErr(fId,eId,msg){
    var f=document.getElementById(fId); if(f) f.classList.add('has-error');
    var e=document.getElementById(eId); if(e) e.textContent=msg;
  }
  function clearErrors(){
    ['name','email','role','experience','message'].forEach(function(f){
      var el=document.getElementById('afield-'+f); if(el) el.classList.remove('has-error');
      var er=document.getElementById('aerr-'+f);   if(er) er.textContent='';
    });
  }
  function validate(){
    var name=document.getElementById('af-name').value.trim();
    var email=document.getElementById('af-email').value.trim();
    var role=document.getElementById('af-role').value;
    var exp=document.getElementById('af-exp').value;
    var msg=document.getElementById('af-msg').value.trim();
    var ok=true;
    if(name.length<2){setErr('afield-name','aerr-name','Full name must be at least 2 characters.');ok=false;}
    if(!EMAIL_RE.test(email)){setErr('afield-email','aerr-email','Please enter a valid email address.');ok=false;}
    if(!VALID_ROLES.includes(role)){setErr('afield-role','aerr-role','Please select a role.');ok=false;}
    if(!VALID_EXP.includes(exp)){setErr('afield-experience','aerr-experience','Please select your experience level.');ok=false;}
    if(msg.length<20){setErr('afield-message','aerr-message','Please write at least 20 characters.');ok=false;}
    return ok;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    clearErrors(); clearBanner();
    if(!validate()) return;
    var name=document.getElementById('af-name').value.trim();
    var email=document.getElementById('af-email').value.trim();
    var phone=document.getElementById('af-phone').value.trim();
    var linkedin=document.getElementById('af-linkedin').value.trim();
    var role=document.getElementById('af-role').value;
    var exp=document.getElementById('af-exp').value;
    var loc=document.getElementById('af-loc').value.trim();
    var msg=document.getElementById('af-msg').value.trim();
    applyBtn.disabled=true; applyBtn.textContent='Submitting…';
    fetch('/api/submit-application',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:name,email:email,phone:phone,linkedin:linkedin,role:role,experience:exp,location:loc,message:msg})
    })
    .then(function(r){ return r.json().then(function(d){ return {status:r.status,data:d}; }); })
    .then(function(r){
      if(r.status===200&&r.data.success){
        form.style.display='none'; success.style.display='block';
      } else if(r.status===422&&r.data.errors){
        var errs=r.data.errors;
        if(errs.name)    setErr('afield-name','aerr-name',errs.name);
        if(errs.email)   setErr('afield-email','aerr-email',errs.email);
        if(errs.role)    setErr('afield-role','aerr-role',errs.role);
        if(errs.experience) setErr('afield-experience','aerr-experience',errs.experience);
        if(errs.message) setErr('afield-message','aerr-message',errs.message);
        applyBtn.disabled=false; applyBtn.textContent='Submit Application →';
      } else {
        showBanner(r.data.error||'Something went wrong. Please try again.');
        applyBtn.disabled=false; applyBtn.textContent='Submit Application →';
      }
    })
    .catch(function(){
      showBanner('Network error. Please check your connection and try again.');
      applyBtn.disabled=false; applyBtn.textContent='Submit Application →';
    });
  });
})();

/* ── Lead form (only on pages that have #leadForm) ── */
(function() {
  var form = document.getElementById('leadForm');
  if (!form) return;

  var SESSION_KEY  = 'solasto_enquiries';
  var MAX          = 3;
  var EMAIL_RE     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var VALID_TIMES  = ['morning','afternoon','evening','anytime'];

  var submitBtn    = document.getElementById('submitBtn');
  var banner       = document.getElementById('formBanner');
  var formSuccess  = document.getElementById('formSuccess');
  var sessionCount = document.getElementById('sessionCount');

  function getCount(){ return parseInt(sessionStorage.getItem(SESSION_KEY)||'0'); }
  function incCount(){ sessionStorage.setItem(SESSION_KEY, getCount()+1); }

  function updateCounter(){
    var rem = MAX - getCount();
    if (rem < MAX) sessionCount.textContent = rem+' enqu'+(rem===1?'iry':'iries')+' remaining this session';
  }
  function showBanner(msg,type){ banner.textContent=msg; banner.className='form-banner '+type; }
  function clearBanner(){ banner.className='form-banner'; banner.textContent=''; }

  function setErr(fId,eId,msg){
    document.getElementById(fId).classList.add('has-error');
    document.getElementById(eId).textContent=msg;
  }
  function clearErrors(){
    ['name','email','company','preferredTime'].forEach(function(f){
      document.getElementById('field-'+f).classList.remove('has-error');
      document.getElementById('err-'+f).textContent='';
    });
  }

  function validate(){
    var name  = document.getElementById('lf-name').value.trim();
    var email = document.getElementById('lf-email').value.trim();
    var co    = document.getElementById('lf-company').value.trim();
    var time  = document.getElementById('lf-time').value;
    var ok    = true;
    if(name.length<2){  setErr('field-name','err-name','Full name must be at least 2 characters.'); ok=false; }
    if(!EMAIL_RE.test(email)){ setErr('field-email','err-email','Please enter a valid work email.'); ok=false; }
    if(co.length<2){    setErr('field-company','err-company','Company name must be at least 2 characters.'); ok=false; }
    if(!VALID_TIMES.includes(time)){ setErr('field-preferredTime','err-preferredTime','Please select a preferred contact time.'); ok=false; }
    return ok;
  }

  updateCounter();

  form.addEventListener('submit', function(e){
    e.preventDefault();
    clearErrors(); clearBanner();

    if(getCount()>=MAX){
      showBanner('You’ve reached the maximum of '+MAX+' enquiries for this session. Contact us at info@solasto.co.in directly.','warn');
      return;
    }
    if(!validate()) return;

    var name  = document.getElementById('lf-name').value.trim();
    var email = document.getElementById('lf-email').value.trim();
    var co    = document.getElementById('lf-company').value.trim();
    var time  = document.getElementById('lf-time').value;

    form.classList.add('submitting');
    submitBtn.disabled=true; submitBtn.textContent='Sending…';

    fetch('/api/submit-lead',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:name,email:email,company:co,preferredTime:time})
    })
    .then(function(r){ return r.json().then(function(d){ return {status:r.status,data:d}; }); })
    .then(function(r){
      if(r.status===200&&r.data.success){
        incCount(); updateCounter();
        form.style.display='none';
        document.getElementById('successEmail').textContent=email;
        formSuccess.style.display='block';
      } else if(r.status===422&&r.data.errors){
        var e=r.data.errors;
        if(e.name)        setErr('field-name','err-name',e.name);
        if(e.email)       setErr('field-email','err-email',e.email);
        if(e.company)     setErr('field-company','err-company',e.company);
        if(e.preferredTime) setErr('field-preferredTime','err-preferredTime',e.preferredTime);
        form.classList.remove('submitting'); submitBtn.disabled=false; submitBtn.textContent='Send enquiry →';
      } else {
        showBanner(r.data.error||'Something went wrong. Please try again.','error');
        form.classList.remove('submitting'); submitBtn.disabled=false; submitBtn.textContent='Send enquiry →';
      }
    })
    .catch(function(){
      showBanner('Network error. Please check your connection and try again.','error');
      form.classList.remove('submitting'); submitBtn.disabled=false; submitBtn.textContent='Send enquiry →';
    });
  });
})();
