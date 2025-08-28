document.addEventListener('DOMContentLoaded', function() {
    const caseStudyCards = document.querySelectorAll('.case-study-card');
    
    caseStudyCards.forEach(card => {
        const expandBtn = card.querySelector('.expand-btn');
        const closeBtn = card.querySelector('.close-btn');
        const detailSection = card.querySelector('.case-study-detail');
        
        // Expand case study
        expandBtn.addEventListener('click', function() {
            detailSection.classList.remove('hidden');
            expandBtn.style.display = 'none';
            
            // Smooth scroll to expanded content
            detailSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        });
        
        // Close case study
        closeBtn.addEventListener('click', function() {
            detailSection.classList.add('hidden');
            expandBtn.style.display = 'block';
            
            // Smooth scroll back to card
            card.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        });
    });
    
    // Close case study when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.case-study-card')) {
            caseStudyCards.forEach(card => {
                const detailSection = card.querySelector('.case-study-detail');
                const expandBtn = card.querySelector('.expand-btn');
                
                if (!detailSection.classList.contains('hidden')) {
                    detailSection.classList.add('hidden');
                    expandBtn.style.display = 'block';
                }
            });
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            caseStudyCards.forEach(card => {
                const detailSection = card.querySelector('.case-study-detail');
                const expandBtn = card.querySelector('.expand-btn');
                
                if (!detailSection.classList.contains('hidden')) {
                    detailSection.classList.add('hidden');
                    expandBtn.style.display = 'block';
                }
            });
        }
    });
}); 