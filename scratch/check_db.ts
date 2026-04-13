import { insforge } from '../src/lib/insforge';
async function run() {
  const { data, error } = await insforge.database.from('support_messages').select('*').limit(1);
  console.log('Columns:', data ? Object.keys(data[0]) : 'No data');
  console.log('Error:', error);
}
run();
