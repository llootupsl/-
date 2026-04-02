/**
 * =============================================================================
 * 永夜熵纪 - DAO 系统测试
 * DAO System Unit Tests
 * =============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import daoSystem, { DAOSystem, Bill, Vote, Proposal } from '../../../src/governance/DAOSystem';

describe('DAOSystem', () => {
  let dao: DAOSystem;

  beforeEach(() => {
    dao = new DAOSystem({
      votingPeriod: 1000, // 1秒 (测试用)
      proposalDelay: 0,
      executionDelay: 100,
      quorum: 0.1,
      threshold: 0.5,
    });
    dao.setTotalVotingPower(100);
  });

  describe('提案创建', () => {
    it('should create a proposal', () => {
      const proposal = dao.createProposal(
        'parameter_change',
        'Test Proposal',
        'Description',
        'proposer-1'
      );

      expect(proposal).toBeDefined();
      expect(proposal.title).toBe('Test Proposal');
      expect(proposal.state).toBe('pending');
    });

    it('should emit proposalCreated event', () => {
      const handler = vi.fn();
      dao.on('proposalCreated', handler);

      dao.createProposal('policy_update', 'Title', 'Desc', 'proposer-1');

      expect(handler).toHaveBeenCalled();
    });

    it('should generate unique proposal IDs', () => {
      const p1 = dao.createProposal('parameter_change', 'P1', 'D1', 'p1');
      const p2 = dao.createProposal('parameter_change', 'P2', 'D2', 'p2');

      expect(p1.id).not.toBe(p2.id);
    });
  });

  describe('投票', () => {
    let proposal: Proposal;

    beforeEach(() => {
      proposal = dao.createProposal(
        'parameter_change',
        'Test',
        'Test',
        'proposer-1'
      );
    });

    it('should accept votes', async () => {
      const result = await dao.vote(proposal.id, 'voter-1', 'for');
      expect(result).toBe(true);
    });

    it('should reject double voting', async () => {
      await dao.vote(proposal.id, 'voter-1', 'for');
      const result = await dao.vote(proposal.id, 'voter-1', 'against');
      expect(result).toBe(false);
    });

    it('should emit voted event', async () => {
      const handler = vi.fn();
      dao.on('voted', handler);

      await dao.vote(proposal.id, 'voter-1', 'for');

      expect(handler).toHaveBeenCalledWith(
        proposal.id,
        'voter-1',
        'yes',
        expect.any(Number)
      );
    });
  });

  describe('提案查询', () => {
    beforeEach(() => {
      dao.createProposal('parameter_change', 'P1', 'D1', 'p1');
      dao.createProposal('policy_update', 'P2', 'D2', 'p2');
    });

    it('should get all proposals', () => {
      const proposals = dao.getProposals();
      expect(proposals.length).toBe(2);
    });

    it('should filter by state', () => {
      const pending = dao.getProposals('pending');
      expect(pending.length).toBe(2);
    });

    it('should get single proposal', () => {
      const all = dao.getProposals();
      const single = dao.getProposal(all[0].id);
      expect(single).toBeDefined();
    });
  });

  describe('统计', () => {
    it('should return correct stats', () => {
      dao.createProposal('parameter_change', 'P1', 'D1', 'p1');
      dao.createProposal('policy_update', 'P2', 'D2', 'p2');

      const stats = dao.getStats();

      expect(stats.totalProposals).toBe(2);
      expect(stats.pending).toBe(2);
      expect(stats.active).toBe(0);
    });
  });
});

describe('投票权重', () => {
  it('should use custom weight calculator', async () => {
    const customCalculator = (voterId: string) => {
      return voterId === 'vip' ? 10 : 1;
    };

    const dao = new DAOSystem({}, customCalculator);
    dao.setTotalVotingPower(100);

    const proposal = dao.createProposal('parameter_change', 'Test', 'Test', 'p1');

    await dao.vote(proposal.id, 'vip', 'for');
    await dao.vote(proposal.id, 'normal', 'for');

    const updatedProposal = dao.getProposal(proposal.id);
    expect(updatedProposal?.votes.for).toBe(11);
  });
});
