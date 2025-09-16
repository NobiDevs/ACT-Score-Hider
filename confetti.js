function shootConfetti(x, y, options = {}) {
    const {
        particleCount = 30,
        spread = 100
    } = options;

    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800'];

    for (let i = 0; i < particleCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = `${x}px`;
        confetti.style.top = `${y}px`;
        confetti.style.width = `${Math.random() * 8 + 4}px`;
        confetti.style.height = `${Math.random() * 8 + 4}px`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.opacity = '1';
        confetti.style.zIndex = '10001';
        confetti.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
        confetti.style.pointerEvents = 'none';

        document.body.appendChild(confetti);

        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * spread + 50;

        const transformX = Math.cos(angle) * distance;
        const transformY = Math.sin(angle) * distance;
        const rotation = Math.random() * 360;

        requestAnimationFrame(() => {
            confetti.style.transform = `translate(${transformX}px, ${transformY}px) rotate(${rotation}deg)`;
            confetti.style.opacity = '0';
        });

        setTimeout(() => {
            confetti.remove();
        }, 1000);
    }
}