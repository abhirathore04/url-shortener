/**
 * Performance Benchmark Script
 * Learning: Automated performance testing with detailed metrics
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

async function runBenchmarks() {
  const results = [];
  
  console.log('🚀 Starting performance benchmarks...\n');

  // Test 1: URL Creation Performance
  console.log('📝 Testing URL Creation...');
  const createUrlResult = await autocannon({
    url: 'http://localhost:3000/api/v1/urls',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: 'https://example.com/performance-test'
    }),
    connections: 100,
    pipelining: 1,
    duration: 30
  });

  results.push({
    test: 'URL Creation',
    ...createUrlResult
  });

  console.log(`✅ URL Creation: ${createUrlResult.requests.average} req/sec\n`);

  // Test 2: URL Redirection Performance  
  console.log('🔄 Testing URL Redirection...');
  const redirectResult = await autocannon({
    url: 'http://localhost:3000/test123', // Pre-seeded URL
    method: 'GET',
    connections: 200,
    pipelining: 1,
    duration: 30
  });

  results.push({
    test: 'URL Redirection',
    ...redirectResult
  });

  console.log(`✅ URL Redirection: ${redirectResult.requests.average} req/sec\n`);

  // Test 3: Analytics Performance
  console.log('📊 Testing Analytics...');
  const analyticsResult = await autocannon({
    url: 'http://localhost:3000/api/v1/urls/test123/analytics',
    method: 'GET',
    connections: 50,
    pipelining: 1,
    duration: 30
  });

  results.push({
    test: 'Analytics',
    ...analyticsResult
  });

  console.log(`✅ Analytics: ${analyticsResult.requests.average} req/sec\n`);

  // Test 4: Health Check Performance
  console.log('🏥 Testing Health Check...');
  const healthResult = await autocannon({
    url: 'http://localhost:3000/api/v1/urls/health',
    method: 'GET',
    connections: 20,
    pipelining: 1,
    duration: 30
  });

  results.push({
    test: 'Health Check',
    ...healthResult
  });

  console.log(`✅ Health Check: ${healthResult.requests.average} req/sec\n`);

  // Save detailed results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(__dirname, `benchmark-report-${timestamp}.json`);
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      cpuCount: require('os').cpus().length,
      totalMemory: require('os').totalmem(),
      freeMemory: require('os').freemem()
    },
    results
  }, null, 2));

  // Generate summary report
  console.log('📋 PERFORMANCE SUMMARY:');
  console.log('=' .repeat(50));
  
  results.forEach(result => {
    console.log(`${result.test}:`);
    console.log(`  Requests/sec: ${result.requests.average}`);
    console.log(`  Latency (avg): ${result.latency.average}ms`);
    console.log(`  Latency (p99): ${result.latency.p99}ms`);
    console.log(`  Throughput: ${result.throughput.average} bytes/sec`);
    console.log('');
  });

  console.log(`📄 Detailed report saved: ${reportPath}`);
  
  // Performance benchmarks (fail if below expectations)
  const expectations = {
    'URL Creation': 500,     // 500+ req/sec
    'URL Redirection': 1000, // 1000+ req/sec  
    'Analytics': 800,        // 800+ req/sec
    'Health Check': 2000     // 2000+ req/sec
  };

  let allPassed = true;
  
  console.log('\n🎯 PERFORMANCE VALIDATION:');
  console.log('=' .repeat(50));
  
  results.forEach(result => {
    const expected = expectations[result.test];
    const actual = result.requests.average;
    const passed = actual >= expected;
    
    console.log(`${result.test}: ${actual} req/sec ${passed ? '✅' : '❌'} (expected: ${expected}+)`);
    
    if (!passed) allPassed = false;
  });

  if (allPassed) {
    console.log('\n🎉 All performance benchmarks passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some performance benchmarks failed. Consider optimization.');
    process.exit(1);
  }
}

// Run benchmarks if executed directly
if (require.main === module) {
  runBenchmarks().catch(console.error);
}

module.exports = { runBenchmarks };
