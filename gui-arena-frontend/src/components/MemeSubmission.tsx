import React, { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { PinataService } from '../Service/pinataService';
import { useGuiBalance } from '../hooks/useGuiBalance';
import { Card, Button, Typography, Upload, Input, Form, message, Space, Tooltip } from 'antd';

const { Title, Text } = Typography;
const { TextArea } = Input;

const MemeSubmission: React.FC = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const { balance: guiBalance, refresh } = useGuiBalance();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const aptosConfig = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(aptosConfig);
  const CONTRACT_ADDRESS = '59da3faa2652c3a96a8beb9e1ca05355bb1d4b30d44b43c2fc64eadebb19dcec';
  const REQUIRED_GUI = 100 * 1e8; // 100 GUI in smallest unit

  const handleFileChange = (info: any) => {
    setFileList(info.fileList.slice(-1)); // Limit to one file
  };

  const handleSubmit = async (values: { title: string; description?: string }) => {
    if (!account) {
      message.error('Please connect your wallet');
      return;
    }

    const balanceNum = parseFloat(guiBalance);
    if (balanceNum < REQUIRED_GUI) {
      message.error('Insufficient GUI tokens. You need at least 100 GUI to submit a meme.');
      return;
    }

    if (fileList.length === 0) {
      message.error('Please upload an image');
      return;
    }

    setUploading(true);
    try {
      const file = fileList[0].originFileObj;
      const pinataResponse = await PinataService.uploadFile(file);
      const ipfsHash = pinataResponse.IpfsHash;

      setUploading(false);
      setSubmitting(true);

      // Build the transaction using the new SDK structure
      const transaction = await aptos.transaction.build.simple({
        sender: account.address,
        data: {
          function: `${CONTRACT_ADDRESS}::gui_arena::submit_meme`,
          functionArguments: [1, values.title, ipfsHash], // Hardcoded tournament_id = 1
        },
      });

      // Sign and submit the transaction
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });

      // Update local storage
      const memes = JSON.parse(localStorage.getItem('hackathon-your-memes') || '[]');
      memes.push({ id: memes.length + 1, title: values.title, ipfsHash, votes: 0 });
      localStorage.setItem('hackathon-your-memes', JSON.stringify(memes));

      refresh(); // Update balance
      message.success('Meme submitted successfully!');
      form.resetFields();
      setFileList([]);
    } catch (error) {
      console.error('Submission failed:', error);
      message.error('Failed to submit meme. Please try again.');
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="arena-bg" />
      <div className="max-w-7xl mx-auto pt-32 px-4 pb-12 relative z-10">
        <Card title={<Title level={3} className="text-gray-100">Submit Your Meme</Title>} className="arena-card">
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item name="title" label={<Text className="text-gray-100">Title</Text>} rules={[{ required: true, message: 'Please enter a title' }]}>
              <Input placeholder="Enter meme title" />
            </Form.Item>
            <Form.Item name="description" label={<Text className="text-gray-100">Description</Text>}>
              <TextArea rows={4} placeholder="Enter meme description (optional)" />
            </Form.Item>
            <Form.Item label={<Text className="text-gray-100">Image</Text>} rules={[{ required: true, message: 'Please upload an image' }]}>
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={handleFileChange}
                beforeUpload={() => false}
                accept="image/*"
              >
                {fileList.length < 1 && '+ Upload'}
              </Upload>
            </Form.Item>
            <Form.Item>
              <Space direction="vertical">
                <Tooltip title="Submitting a meme requires staking 100 GUI tokens.">
                  <Text className="text-gray-100">Cost: {(REQUIRED_GUI / 1e8).toFixed(2)} GUI</Text>
                </Tooltip>
                <Text className="text-gray-100">Your Balance: {(parseFloat(guiBalance) / 1e8).toFixed(2)} GUI</Text>
                {parseFloat(guiBalance) < REQUIRED_GUI && (
                  <Text type="danger">Insufficient balance</Text>
                )}
              </Space>
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                disabled={!account || parseFloat(guiBalance) < REQUIRED_GUI}
                loading={uploading || submitting}
                className="arena-btn h-12 px-8 text-lg"
                block
              >
                {uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Submit Meme'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default MemeSubmission;