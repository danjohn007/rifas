const axios = require('axios');

class LotteryService {
  constructor() {
    // Mexican National Lottery API endpoint (mock for now - real implementation would use official API)
    this.apiEndpoint = process.env.LOTTERY_API_URL || 'https://api.loteria-nacional.gob.mx';
    this.apiKey = process.env.LOTTERY_API_KEY;
  }

  /**
   * Get lottery results for a specific date
   * @param {Date} date - The lottery draw date
   * @returns {Promise<Object>} Lottery results
   */
  async getLotteryResults(date) {
    try {
      // Format date for API call (YYYY-MM-DD)
      const dateString = date.toISOString().split('T')[0];
      
      // For demo purposes, we'll generate mock data
      // In production, this would call the real Mexican National Lottery API
      if (process.env.NODE_ENV === 'development') {
        return this.generateMockLotteryResult(date);
      }

      const response = await axios.get(`${this.apiEndpoint}/results/${dateString}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return this.parseLotteryResponse(response.data);
    } catch (error) {
      console.error('Error fetching lottery results:', error.message);
      
      // Fallback to mock data if API fails
      if (process.env.NODE_ENV !== 'test') {
        console.log('Falling back to mock lottery data');
        return this.generateMockLotteryResult(date);
      }
      
      throw new Error('Failed to fetch lottery results');
    }
  }

  /**
   * Extract last 5 digits from lottery number
   * @param {string} lotteryNumber - Full lottery number
   * @returns {string} Last 5 digits
   */
  extractLastFiveDigits(lotteryNumber) {
    const cleanNumber = lotteryNumber.toString().replace(/\D/g, '');
    return cleanNumber.slice(-5).padStart(5, '0');
  }

  /**
   * Find winning ticket number using lottery result
   * @param {string} lotteryResult - Full lottery result number
   * @param {Array} soldTickets - Array of sold ticket numbers
   * @returns {Object} Winner information
   */
  findWinner(lotteryResult, soldTickets) {
    const winningDigits = this.extractLastFiveDigits(lotteryResult);
    
    // Look for exact match first
    const exactMatch = soldTickets.find(ticket => ticket === winningDigits);
    if (exactMatch) {
      return {
        winnerFound: true,
        winningNumber: exactMatch,
        matchType: 'exact',
        lotteryResult: lotteryResult,
        winningDigits: winningDigits
      };
    }

    // If no exact match, find closest number (going down)
    const winningNum = parseInt(winningDigits);
    const sortedTickets = soldTickets
      .map(ticket => parseInt(ticket))
      .filter(num => num <= winningNum)
      .sort((a, b) => b - a);

    if (sortedTickets.length > 0) {
      const closestNumber = sortedTickets[0].toString().padStart(5, '0');
      return {
        winnerFound: true,
        winningNumber: closestNumber,
        matchType: 'closest_down',
        lotteryResult: lotteryResult,
        winningDigits: winningDigits,
        actualWinning: winningDigits
      };
    }

    // No winner found
    return {
      winnerFound: false,
      winningNumber: null,
      matchType: 'none',
      lotteryResult: lotteryResult,
      winningDigits: winningDigits
    };
  }

  /**
   * Validate lottery date and result format
   * @param {Date} date - Lottery date
   * @param {string} result - Lottery result
   * @returns {boolean} Is valid
   */
  validateLotteryData(date, result) {
    // Check if date is not in the future
    if (date > new Date()) {
      return false;
    }

    // Check if result is a valid number with at least 5 digits
    const cleanResult = result.toString().replace(/\D/g, '');
    return cleanResult.length >= 5;
  }

  /**
   * Generate mock lottery result for development/testing
   * @param {Date} date - Date for the lottery
   * @returns {Object} Mock lottery result
   */
  generateMockLotteryResult(date) {
    // Generate a random 6-digit number for demo
    const randomResult = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    
    return {
      date: date.toISOString().split('T')[0],
      firstPrize: randomResult,
      drawNumber: Math.floor(Math.random() * 1000) + 1,
      series: 'A',
      isOfficial: false, // Mark as mock data
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Parse official lottery API response
   * @param {Object} apiResponse - Raw API response
   * @returns {Object} Parsed lottery result
   */
  parseLotteryResponse(apiResponse) {
    // This would parse the real API response format
    // Implementation depends on the actual Mexican National Lottery API structure
    return {
      date: apiResponse.fecha || apiResponse.date,
      firstPrize: apiResponse.primer_premio || apiResponse.firstPrize,
      drawNumber: apiResponse.numero_sorteo || apiResponse.drawNumber,
      series: apiResponse.serie || apiResponse.series,
      isOfficial: true,
      timestamp: apiResponse.timestamp || new Date().toISOString()
    };
  }

  /**
   * Schedule automatic result checking for a specific date
   * @param {Date} lotteryDate - Date to check results
   * @param {Function} callback - Callback function when results are available
   */
  scheduleResultCheck(lotteryDate, callback) {
    const now = new Date();
    const checkTime = new Date(lotteryDate);
    checkTime.setHours(21, 0, 0, 0); // Check at 9 PM on lottery day

    const delay = checkTime.getTime() - now.getTime();

    if (delay > 0) {
      setTimeout(async () => {
        try {
          const results = await this.getLotteryResults(lotteryDate);
          callback(null, results);
        } catch (error) {
          callback(error, null);
        }
      }, delay);
    } else {
      // Date has passed, check immediately
      this.getLotteryResults(lotteryDate)
        .then(results => callback(null, results))
        .catch(error => callback(error, null));
    }
  }
}

module.exports = new LotteryService();