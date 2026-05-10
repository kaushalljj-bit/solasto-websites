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
