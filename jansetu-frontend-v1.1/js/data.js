/* data.js - the service catalogue and FAQ content.
   Rendering is data-driven: adding a service here adds it to the directory,
   the modal and the application form automatically (no HTML changes needed). */
(function (w) {
  'use strict';
  var JS = (w.JanSetu = w.JanSetu || {});

  JS.STATUS = ['Submitted', 'Under review', 'Document verification', 'Approved'];
  JS.CATEGORIES = ['Certificates', 'Civic', 'Welfare', 'Grievance'];
  /* Each service can declare extra form fields (extra) that appear in step 2. */
  JS.SERVICES = [
    { id: 'income', title: 'Income Certificate', dept: 'Revenue Department', cat: 'Certificates', days: 7, fee: 'Free',
      desc: 'Official proof of your family\u2019s annual income, used for scholarships and welfare schemes.',
      eligibility: ['I have lived in the state for at least 3 years', 'I am 18 years or older'],
      docs: ['ID proof', 'Address proof', 'Income declaration'],
      extra: [{ id: 'annualIncome', label: 'Annual family income (Rs)', type: 'text', kind: 'whole', hint: 'Whole rupees, e.g. 120000' }] },
    { id: 'birth', title: 'Birth Certificate', dept: 'Health & Family Welfare', cat: 'Certificates', days: 3, fee: 'Rs 20',
      desc: 'Legal record of a birth, needed for school admission and identity documents.',
      eligibility: ['The birth took place in this state', 'I am a parent or legal guardian'],
      docs: ['Hospital discharge slip', 'Parent ID proof'],
      extra: [{ id: 'childName', label: 'Child\u2019s full name', type: 'text', kind: 'name' },
              { id: 'childDob', label: 'Child\u2019s date of birth', type: 'date', kind: 'pastDate' },
              { id: 'birthPlace', label: 'Place of birth', type: 'text', kind: 'text' }] },
    { id: 'residence', title: 'Residence Certificate', dept: 'Revenue Department', cat: 'Certificates', days: 5, fee: 'Free',
      desc: 'Proof that you live at your stated address.',
      eligibility: ['I currently live at the address I will enter', 'I am 18 years or older'],
      docs: ['ID proof', 'Address proof'],
      extra: [{ id: 'years', label: 'Years at this address', type: 'text', kind: 'whole', hint: 'Whole number, e.g. 4' }] },
    { id: 'marriage', title: 'Marriage Certificate', dept: 'Registrar Office', cat: 'Certificates', days: 10, fee: 'Rs 100',
      desc: 'Official registration of a marriage.',
      eligibility: ['Both partners are 18 years or older', 'Both partners can attend for verification'],
      docs: ['ID proof of both partners', 'Marriage photograph'],
      extra: [{ id: 'spouse', label: 'Spouse\u2019s full name', type: 'text', kind: 'name' },
              { id: 'marriageDate', label: 'Date of marriage', type: 'date', kind: 'pastDate' }] },
    { id: 'proptax', title: 'Property Tax Record', dept: 'Municipal Corporation', cat: 'Civic', days: 1, fee: 'Free',
      desc: 'View and download your property tax payment history.',
      eligibility: ['I am the owner or registered occupant'],
      docs: ['Property ownership proof'],
      extra: [{ id: 'propertyId', label: 'Property ID', type: 'text', kind: 'text', hint: 'Printed on your tax receipt' }] },
    { id: 'trade', title: 'Trade Licence', dept: 'Municipal Corporation', cat: 'Civic', days: 10, fee: 'Rs 250',
      desc: 'Permission to run a shop or small business in the city.',
      eligibility: ['I have a business address in the city', 'I am 18 years or older'],
      docs: ['ID proof', 'Shop address proof', 'Photograph'],
      extra: [{ id: 'business', label: 'Business name', type: 'text', kind: 'text' },
              { id: 'btype', label: 'Type of business', type: 'select', kind: 'select', options: ['Retail shop', 'Food stall', 'Workshop', 'Other'] }] },
    { id: 'water', title: 'Water Connection Request', dept: 'Water Board', cat: 'Civic', days: 12, fee: 'Rs 500',
      desc: 'Apply for a new household or commercial water connection.',
      eligibility: ['I own or legally occupy the premises'],
      docs: ['Ownership or rent proof', 'ID proof'],
      extra: [{ id: 'ctype', label: 'Connection type', type: 'select', kind: 'select', options: ['Household', 'Commercial'] },
              { id: 'plot', label: 'Plot / house number', type: 'text', kind: 'text' }] },
    { id: 'pension', title: 'Old-Age Pension', dept: 'Social Welfare', cat: 'Welfare', days: 15, fee: 'Free',
      desc: 'Monthly financial support for senior citizens.',
      eligibility: ['I am 60 years or older', 'I am a resident of the state'],
      docs: ['Age proof', 'Bank passbook first page', 'Photograph'],
      minAge: 60, extra: [] },
    { id: 'scholar', title: 'Scholarship Application', dept: 'Education Department', cat: 'Welfare', days: 20, fee: 'Free',
      desc: 'Financial aid for eligible students.',
      eligibility: ['I am enrolled in a recognised institution', 'My family income is below the limit'],
      docs: ['ID proof', 'Admission letter', 'Income certificate'],
      extra: [{ id: 'course', label: 'Course name', type: 'text', kind: 'text' },
              { id: 'institution', label: 'Institution name', type: 'text', kind: 'text' }] },
    { id: 'crop', title: 'Crop Support Scheme', dept: 'Agriculture Department', cat: 'Welfare', days: 21, fee: 'Free',
      desc: 'Assistance for farmers affected by crop loss.',
      eligibility: ['I own or lease agricultural land'],
      docs: ['Land record', 'Bank passbook first page'],
      extra: [{ id: 'land', label: 'Land area (acres)', type: 'text', kind: 'whole' },
              { id: 'crop', label: 'Main crop', type: 'select', kind: 'select', options: ['Rice', 'Wheat', 'Jute', 'Vegetables', 'Other'] }] },
    { id: 'street', title: 'Streetlight Repair', dept: 'Municipal Corporation', cat: 'Grievance', days: 5, fee: 'Free',
      desc: 'Report a broken or missing streetlight.',
      eligibility: ['I can describe the exact location'],
      docs: ['Photo of the problem'],
      extra: [{ id: 'location', label: 'Location / nearest landmark', type: 'text', kind: 'text' }] },
    { id: 'road', title: 'Road Repair Complaint', dept: 'Public Works Department', cat: 'Grievance', days: 14, fee: 'Free',
      desc: 'Report potholes or damaged roads.',
      eligibility: ['I can describe the exact location'],
      docs: ['Photo of the problem'],
      extra: [{ id: 'location', label: 'Road name and landmark', type: 'text', kind: 'text' }] }
  ];

  JS.getService = function (id) {
    for (var i = 0; i < JS.SERVICES.length; i++) if (JS.SERVICES[i].id === id) return JS.SERVICES[i];
    return null;
  };

  JS.FAQS = [
    { q: 'Do I need an account to search for services?', a: 'No. You can browse services and track an application with its reference ID without logging in. An account is needed to apply and to keep your documents.' },
    { q: 'Which documents can I upload?', a: 'PDF, JPG or PNG files up to 2 MB each. Scan or photograph the document in good light so all text is readable.' },
    { q: 'How do I know the status of my application?', a: 'Use Track and enter the reference ID from your receipt. Each stage is shown with a date, and you are notified when it changes.' },
    { q: 'Can I save my application and finish later?', a: 'Yes. Your progress is saved automatically on this device. Uploaded files must be added again when you return.' },
    { q: 'Is my information safe?', a: 'This prototype stores data only in your own browser. The production system will use encrypted storage and role-based access.' }
  ];
})(window);
