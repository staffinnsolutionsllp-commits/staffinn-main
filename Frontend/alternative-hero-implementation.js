// Alternative Hero Section Implementation (if background images don't work)
// Replace the hero section in Home.jsx with this:

<section className="hero-section">
    <div className="hero-image-container">
        {/* Use img element instead of background-image */}
        <img 
            src={getCurrentHeroImage()} 
            alt="Hero Background" 
            className="hero-background-img"
            onLoad={(e) => {
                console.log('✅ Hero image loaded successfully:', e.target.src);
            }}
            onError={(e) => {
                console.error('❌ Hero image failed to load:', e.target.src);
                // Fallback to default image
                e.target.src = HomeImage;
            }}
        />
        
        {/* Slideshow indicators */}
        {heroImages.length > 1 && (
            <div className="slideshow-indicators">
                {heroImages.map((_, index) => (
                    <span 
                        key={index} 
                        className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={() => setCurrentImageIndex(index)}
                    />
                ))}
            </div>
        )}
        
        {/* Search container overlay */}
        <div className="home-search-container">
            {/* Your existing search form */}
        </div>
    </div>
</section>

// And add this CSS to Home.css:
.hero-image-container {
    position: relative;
    width: 100%;
    height: 400px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
}

.hero-background-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
}

.home-search-container {
    position: relative;
    z-index: 10;
    /* Your existing search container styles */
}

.slideshow-indicators {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 15;
    /* Your existing indicator styles */
}