import React from 'react';
import { motion } from 'framer-motion';

export function WaveText({ text, className }) {
    if (!text) return null;
    return (
        <motion.span
            className={className}
            style={{ display: 'inline-block', cursor: 'pointer', transition: 'all 0.3s' }}
            whileHover="hover"
            initial="initial"
        >
            {text.split("").map((char, index) => (
                <motion.span
                    key={index}
                    style={{ display: 'inline-block', whiteSpace: 'pre' }}
                    variants={{
                        initial: {
                            y: 0,
                            scale: 1,
                        },
                        hover: {
                            y: -4,
                            scale: 1.2,
                            transition: {
                                type: "spring",
                                stiffness: 300,
                                damping: 15,
                                delay: index * 0.03,
                            },
                        },
                    }}
                >
                    {char}
                </motion.span>
            ))}
        </motion.span>
    );
}

export default WaveText;
