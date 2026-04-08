import React, { useState } from 'react';

const ResponsiveDemo = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="responsive-demo">
      <h2 className="text-2xl font-bold mb-6">响应式设计演示</h2>
      
      {/* 响应式布局演示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-bg-surface p-4 rounded-lg border border-border-default">
          <h3 className="text-lg font-semibold mb-2">卡片 1</h3>
          <p className="text-text-secondary">这是一个响应式卡片，在不同屏幕尺寸下会自动调整布局。</p>
        </div>
        <div className="bg-bg-surface p-4 rounded-lg border border-border-default">
          <h3 className="text-lg font-semibold mb-2">卡片 2</h3>
          <p className="text-text-secondary">这是一个响应式卡片，在不同屏幕尺寸下会自动调整布局。</p>
        </div>
        <div className="bg-bg-surface p-4 rounded-lg border border-border-default">
          <h3 className="text-lg font-semibold mb-2">卡片 3</h3>
          <p className="text-text-secondary">这是一个响应式卡片，在不同屏幕尺寸下会自动调整布局。</p>
        </div>
      </div>

      {/* 响应式导航演示 */}
      <div className="bg-bg-surface rounded-lg border border-border-default mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center p-4">
          <div className="text-xl font-bold text-accent mb-4 md:mb-0">Logo</div>
          <nav className="flex flex-col md:flex-row gap-4">
            <a href="#" className="hover:text-accent transition-colors">首页</a>
            <a href="#" className="hover:text-accent transition-colors">关于</a>
            <a href="#" className="hover:text-accent transition-colors">服务</a>
            <a href="#" className="hover:text-accent transition-colors">联系我们</a>
          </nav>
        </div>
      </div>

      {/* 响应式按钮演示 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <button 
          className="bg-accent-bg text-accent border border-accent-border px-4 py-2 rounded-md hover:shadow-accent-glow transition-all"
          onClick={() => setCount(count + 1)}
        >
          点击次数: {count}
        </button>
        <button 
          className="bg-bg-elevated text-text-primary border border-border-default px-4 py-2 rounded-md hover:border-accent transition-all"
        >
          次要按钮
        </button>
      </div>

      {/* 响应式文本演示 */}
      <div className="bg-bg-surface p-6 rounded-lg border border-border-default mb-8">
        <h3 className="text-xl font-bold mb-4">响应式文本</h3>
        <p className="text-text-primary mb-2">
          这段文本在不同屏幕尺寸下会保持良好的可读性。
        </p>
        <p className="text-text-secondary">
          使用Tailwind CSS的响应式类，我们可以轻松实现不同屏幕尺寸下的布局调整，
          确保在手机、平板和桌面设备上都有良好的用户体验。
        </p>
      </div>

      {/* 响应式网格演示 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="bg-bg-surface p-3 rounded-md border border-border-default aspect-square flex items-center justify-center">
            {index + 1}
          </div>
        ))}
      </div>

      {/* 响应式信息 */}
      <div className="mt-8 p-4 bg-bg-elevated rounded-lg border border-border-default">
        <h3 className="text-lg font-semibold mb-2">响应式设计说明</h3>
        <ul className="list-disc list-inside text-text-secondary space-y-2">
          <li>在移动设备上：单列布局，垂直导航</li>
          <li>在平板设备上：双列布局，水平导航</li>
          <li>在桌面设备上：多列布局，水平导航</li>
          <li>使用Tailwind CSS的响应式断点：sm, md, lg, xl</li>
        </ul>
      </div>
    </div>
  );
};

export default ResponsiveDemo;