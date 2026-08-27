const supabase = require('../config/db');

function keywordCategorizer(description = '') {
  const desc = description.toLowerCase();
  
  let category = 'General Facilities & Utilities';
  if (desc.includes('wi-fi') || desc.includes('wifi') || desc.includes('internet') || desc.includes('network') || desc.includes('router') || desc.includes('login')) {
    category = 'IT & Wi-Fi Services';
  } else if (desc.includes('hostel') || desc.includes('room') || desc.includes('bathroom') || desc.includes('shower') || desc.includes('mess') || desc.includes('canteen')) {
    category = 'Hostel Maintenance & Cleanliness';
  } else if (desc.includes('bus') || desc.includes('transport') || desc.includes('shuttle') || desc.includes('route') || desc.includes('driver')) {
    category = 'Campus Transportation';
  } else if (desc.includes('lab') || desc.includes('academic') || desc.includes('class') || desc.includes('classroom') || desc.includes('projector') || desc.includes('bench') || desc.includes('board')) {
    category = 'Academic Block Infrastructure';
  }

  let priority = 'Low';
  if (desc.includes('fire') || desc.includes('water leak') || desc.includes('shock') || desc.includes('electric') || desc.includes('short circuit') || desc.includes('injury') || desc.includes('critical')) {
    priority = 'Critical';
  } else if (desc.includes('broken glass') || desc.includes('no water') || desc.includes('exam') || desc.includes('theft') || desc.includes('urgent')) {
    priority = 'High';
  } else if (desc.includes('broken') || desc.includes('projector') || desc.includes('fan') || desc.includes('dirty') || desc.includes('cleaning') || desc.includes('delay')) {
    priority = 'Medium';
  }

  return { category, priority };
}

async function analyzeComplaint(description, location) {
  // Rule-based fallback
  const suggestions = keywordCategorizer(description);

  // Check for duplicate complaints
  let duplicates = [];
  try {
    const { data, error } = await supabase
      .from('complaints')
      .select('id, title, status, created_at')
      .eq('location', location)
      .eq('category', suggestions.category)
      .in('status', ['Submitted', 'Under Review', 'Assigned', 'In Progress']);

    if (!error && data) {
      duplicates = data;
    }
  } catch (err) {
    console.error('Error finding duplicate complaints:', err);
  }

  return {
    category: suggestions.category,
    priority: suggestions.priority,
    isPotentialDuplicate: duplicates.length > 0,
    duplicates
  };
}

module.exports = {
  analyzeComplaint
};
